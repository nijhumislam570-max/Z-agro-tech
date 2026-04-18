import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { compressImage, getCompressionMessage } from '@/lib/mediaCompression';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  className, 
  bucket = 'product-images',
  folder = 'products'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image size must be less than 20MB');
      return;
    }

    setUploading(true);
    setCompressing(true);
    setProgress(0);

    try {
      setProgress(20);
      const compressed = await compressImage(file, 'product');
      setProgress(60);
      setCompressing(false);

      if (compressed.compressionRatio > 1) {
        toast.info(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
      }

      const fileExt = compressed.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      setProgress(80);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressed.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);
      onChange(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setCompressing(false);
      setProgress(0);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImage(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-secondary">
          <img 
            src={value} 
            alt="Product" 
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'relative w-full aspect-video rounded-lg border-2 border-dashed transition-colors cursor-pointer',
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            uploading && 'pointer-events-none opacity-50'
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
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
            {uploading ? (
              <div className="w-full max-w-[200px] space-y-3">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center">
                  {compressing ? 'Optimizing...' : 'Uploading...'}
                </p>
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  {dragActive ? (
                    <ImageIcon className="h-6 w-6" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <p className="text-sm font-medium text-center">
                  {dragActive ? 'Drop image here' : 'Click or drag image to upload'}
                </p>
                <p className="text-xs mt-1 text-center">PNG, JPG, WEBP up to 20MB (auto-compressed)</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
