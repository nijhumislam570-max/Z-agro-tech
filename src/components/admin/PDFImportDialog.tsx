import { useState, useRef } from 'react';
import { FileText, AlertCircle, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface ExtractedProduct {
  name: string;
  description: string | null;
  price: number;
  category: 'Pet' | 'Farm';
  product_type: string | null;
  stock: number;
  badge: string | null;
  discount: number | null;
  image_url: string | null;
}

interface PDFImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'extracting' | 'preview' | 'importing';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function PDFImportDialog({ open, onOpenChange }: PDFImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF file must be less than 10MB');
      return;
    }

    setFileName(file.name);
    setStep('extracting');
    setError(null);
    setProgress(10);

    try {
      // Convert PDF to base64 and send directly to AI (Gemini supports native PDF)
      setProgress(20);
      const arrayBuffer = await file.arrayBuffer();
      const pdfBase64 = arrayBufferToBase64(arrayBuffer);
      setProgress(40);

      // Send to AI edge function for extraction
      const { data, error: fnError } = await supabase.functions.invoke('parse-product-pdf', {
        body: { pdfBase64 },
      });

      setProgress(80);

      if (fnError) {
        throw new Error(fnError.message || 'Failed to process PDF');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.products?.length) {
        throw new Error('No products could be extracted from this PDF. Make sure it contains product information (names, prices, etc.).');
      }

      setProducts(data.products);
      setRemovedIndices(new Set());
      setProgress(100);
      setStep('preview');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process PDF';
      setError(msg);
      setStep('upload');
      toast.error(msg);
    }
  };

  const handleImport = async () => {
    const activeProducts = products.filter((_, i) => !removedIndices.has(i));
    if (!activeProducts.length) return;

    setStep('importing');
    setProgress(0);

    try {
      // Re-host any external image URLs
      const imageUrls = activeProducts
        .map((p) => p.image_url)
        .filter((url): url is string => !!url && url.startsWith('http'));

      let imageMap: Record<string, string> = {};

      if (imageUrls.length > 0) {
        const uniqueUrls = [...new Set(imageUrls)];
        const { data: uploadData } = await supabase.functions.invoke('upload-image-url', {
          body: { urls: uniqueUrls },
        });
        if (uploadData?.results) {
          for (const r of uploadData.results) {
            if (r.storedUrl) imageMap[r.originalUrl] = r.storedUrl;
          }
        }
        setProgress(20);
      }

      const productsToInsert = activeProducts.map(p => ({
        name: p.name,
        description: p.description || null,
        price: p.price,
        category: p.category,
        product_type: p.product_type || null,
        stock: p.stock,
        badge: p.badge || null,
        discount: p.discount,
        image_url: p.image_url ? (imageMap[p.image_url] || p.image_url) : null,
      }));

      // Insert in batches of 50
      const batchSize = 50;
      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from('products').insert(batch);
        if (error) throw error;
        setProgress(20 + Math.round(((i + batch.length) / productsToInsert.length) * 80));
      }

      toast.success(`Successfully imported ${productsToInsert.length} products from PDF`);

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to import products';
      toast.error(msg);
      setStep('preview');
    }
  };

  const toggleRemoveProduct = (index: number) => {
    setRemovedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('upload');
      setProducts([]);
      setRemovedIndices(new Set());
      setError(null);
      setProgress(0);
      setFileName('');
    }, 200);
  };

  const activeCount = products.length - removedIndices.size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Import Products from PDF
          </DialogTitle>
          <DialogDescription className="text-sm">
            Upload a product catalog, price list, or invoice PDF. AI will automatically extract product data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Upload Step */}
          {step === 'upload' && (
            <>
              {error && (
                <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <div
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-8 sm:p-12 transition-colors cursor-pointer',
                  dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                    // Reset input so the same file can be selected again
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium">
                    {dragActive ? 'Drop PDF file here' : 'Click or drag PDF file to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Product catalogs, price lists, invoices (max 10MB)
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                  AI reads the PDF directly — works with both digital and scanned documents.
                </p>
              </div>
            </>
          )}

          {/* Extracting Step */}
          {step === 'extracting' && (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <p className="font-medium mb-1">Analyzing PDF with AI</p>
              <p className="text-sm text-muted-foreground mb-4">
                Extracting products from "{fileName}"...
              </p>
              <div className="w-full max-w-xs">
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">This may take 15-45 seconds</p>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="p-3 bg-success/10 rounded-xl border border-success/20 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                <span className="text-sm font-medium">
                  {products.length} product{products.length !== 1 ? 's' : ''} extracted from "{fileName}"
                </span>
              </div>

              {removedIndices.size > 0 && (
                <p className="text-xs text-muted-foreground">
                  {removedIndices.size} product{removedIndices.size !== 1 ? 's' : ''} excluded · {activeCount} will be imported
                </p>
              )}

              <ScrollArea className="h-[300px] sm:h-[350px] rounded-xl border">
                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-border">
                  {products.map((product, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-3 flex items-start gap-3 transition-opacity',
                        removedIndices.has(index) && 'opacity-40'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                          <span className="text-xs font-medium text-primary">৳{product.price}</span>
                          {product.product_type && (
                            <span className="text-[10px] text-muted-foreground">{product.product_type}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => toggleRemoveProduct(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product, index) => (
                        <TableRow
                          key={index}
                          className={cn(removedIndices.has(index) && 'opacity-40')}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {product.product_type || '-'}
                          </TableCell>
                          <TableCell className="font-medium">৳{product.price}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleRemoveProduct(index)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>

              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep('upload'); setProducts([]); setRemovedIndices(new Set()); setError(null); }}
                className="w-full rounded-xl"
              >
                Upload Different PDF
              </Button>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="py-8 flex flex-col items-center text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="font-medium mb-2">Importing Products...</p>
              <div className="w-full max-w-xs">
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{activeCount} products</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 border-t pt-4">
          <Button variant="outline" onClick={handleClose} className="rounded-xl h-11 sm:h-10">
            Cancel
          </Button>
          {step === 'preview' && (
            <Button
              onClick={handleImport}
              disabled={activeCount === 0}
              className="rounded-xl h-11 sm:h-10"
            >
              Import {activeCount} Product{activeCount !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
