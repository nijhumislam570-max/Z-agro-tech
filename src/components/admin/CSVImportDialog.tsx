import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
import { parseCSV, generateCSVTemplate, downloadCSV, ProductCSVRow, ParseResult } from '@/lib/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text);
      setParseResult(result);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    downloadCSV(template, 'product-import-template.csv');
  };

  const handleImport = async () => {
    if (!parseResult?.data.length) return;

    setImporting(true);
    try {
      // Collect external image URLs that need re-hosting
      const imageUrls = parseResult.data
        .map((row) => row.image_url)
        .filter((url): url is string => !!url && url.startsWith('http'));

      let imageMap: Record<string, string> = {};

      // Re-host external images via edge function
      if (imageUrls.length > 0) {
        const uniqueUrls = [...new Set(imageUrls)];
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-image-url', {
          body: { urls: uniqueUrls },
        });

        if (!uploadError && uploadData?.results) {
          for (const r of uploadData.results) {
            if (r.storedUrl) {
              imageMap[r.originalUrl] = r.storedUrl;
            }
          }
        }
      }

      const products = parseResult.data.map((row: ProductCSVRow) => ({
        name: row.name,
        description: row.description || null,
        price: row.price,
        category: row.category,
        product_type: row.product_type || null,
        stock: row.stock ?? 100,
        badge: row.badge || null,
        discount: row.discount || null,
        image_url: row.image_url ? (imageMap[row.image_url] || row.image_url) : null,
      }));

      const { error } = await supabase.from('products').insert(products);

      if (error) throw error;

      toast.success(`Successfully imported ${products.length} products`);
      
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      onOpenChange(false);
      setParseResult(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import products';
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setParseResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Products from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>Need the correct format?</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              Download Template
            </Button>
          </div>

          {/* File Upload Zone */}
          {!parseResult && (
            <div
              className={cn(
                'relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
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
                accept=".csv"
                onChange={handleChange}
                className="hidden"
              />
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">
                  {dragActive ? 'Drop CSV file here' : 'Click or drag CSV file to upload'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .csv files
                </p>
              </div>
            </div>
          )}

          {/* Parse Results */}
          {parseResult && (
            <div className="space-y-4">
              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {parseResult.errors.length} error(s) found
                    </span>
                  </div>
                  <ul className="text-sm text-destructive/80 space-y-1">
                    {parseResult.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>Row {error.row}: {error.message}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>...and {parseResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Success Summary */}
              {parseResult.data.length > 0 && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {parseResult.data.length} product(s) ready to import
                    </span>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parseResult.data.length > 0 && (
                <ScrollArea className="h-[300px] rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.data.slice(0, 50).map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>৳{product.price}</TableCell>
                          <TableCell>{product.stock ?? 100}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.product_type || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parseResult.data.length > 50 && (
                    <div className="p-3 text-center text-sm text-muted-foreground border-t">
                      Showing first 50 of {parseResult.data.length} products
                    </div>
                  )}
                </ScrollArea>
              )}

              {/* Reset Button */}
              <Button 
                variant="outline" 
                onClick={() => setParseResult(null)}
                className="w-full"
              >
                Upload Different File
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!parseResult?.success || importing}
          >
            {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Import {parseResult?.data.length || 0} Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
