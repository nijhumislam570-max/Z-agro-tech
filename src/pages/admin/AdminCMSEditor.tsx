import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Eye, Upload, X, FileText } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCMSArticle, useCreateArticle, useUpdateArticle, useCMSCategories } from '@/hooks/useCMS';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  category: z.string().min(1, 'Category is required').regex(/^[^<>]*$/, 'Invalid characters'),
  excerpt: z.string().max(300).optional(),
  content: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type FormValues = z.infer<typeof schema>;

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Simple Markdown to HTML converter
const markdownToHtml = (md: string): string => {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hubloi])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
};

const AdminCMSEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const { data: article, isLoading } = useCMSArticle(id);
  const { data: categories } = useCMSCategories();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', slug: '', category: '', excerpt: '', content: '', tags: '', status: 'draft' },
  });

  // Populate form when editing
  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt || '',
        content: article.content || '',
        tags: (article.tags || []).join(', '),
        status: article.status as 'draft' | 'published' | 'archived',
      });
      setFeaturedImage(article.featured_image);
    }
  }, [article, form]);

  // Auto-generate slug from title (only for new articles)
  const title = form.watch('title');
  useEffect(() => {
    if (!isEditing && title) {
      form.setValue('slug', slugify(title), { shouldValidate: true });
    }
  }, [title, isEditing, form]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('cms-media').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('cms-media').getPublicUrl(path);
      setFeaturedImage(urlData.publicUrl);
      toast.success('Image uploaded');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const onSubmit = async (values: FormValues) => {
    const tags = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    let finalCategory = values.category;
    
    // If custom category, create it in cms_categories then use its slug
    if (isCustomCategory && customCategoryName.trim()) {
      const slug = slugify(customCategoryName.trim());
      if (!slug) {
        toast.error('Invalid category name');
        return;
      }
      const { error } = await supabase
        .from('cms_categories')
        .insert({ name: customCategoryName.trim(), slug, is_active: true })
        .select()
        .single();
      if (error && !error.message.includes('duplicate')) {
        toast.error('Failed to create category: ' + error.message);
        return;
      }
      finalCategory = slug;
    }
    
    const payload = {
      title: values.title,
      slug: values.slug,
      category: finalCategory,
      excerpt: values.excerpt || null,
      content: values.content || null,
      status: values.status,
      tags,
      featured_image: featuredImage,
      author_id: user!.id,
    };

    if (isEditing) {
      await updateArticle.mutateAsync({ id, ...payload });
    } else {
      await createArticle.mutateAsync(payload);
    }
    navigate('/admin/cms');
  };

  if (isEditing && isLoading) {
    return (
        <AdminLayout title="CMS Editor">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </AdminLayout>
    );
  }

  return (
      <AdminLayout title="CMS Editor">
        <div className="space-y-4 sm:space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/cms')} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {isEditing ? 'Edit Article' : 'New Article'}
              </h1>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input {...field} placeholder="Article title" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl><Input {...field} placeholder="article-slug" className="font-mono text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="excerpt" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt <span className="text-muted-foreground text-xs">(max 300 chars)</span></FormLabel>
                      <FormControl><Textarea {...field} placeholder="Short summary..." rows={2} maxLength={300} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Content with preview toggle */}
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Content <span className="text-muted-foreground text-xs">(Markdown supported)</span></FormLabel>
                        <Button type="button" variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => setPreviewMode(!previewMode)}>
                          <Eye className="h-3 w-3" />
                          {previewMode ? 'Edit' : 'Preview'}
                        </Button>
                      </div>
                      <FormControl>
                        {previewMode ? (
                          <Card className="min-h-[300px]">
                            <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(field.value ? markdownToHtml(field.value) : '<p class="text-muted-foreground">Nothing to preview</p>') }} />
                            </CardContent>
                          </Card>
                        ) : (
                          <Textarea {...field} placeholder="Write your article content here..." rows={14} className="font-mono text-sm" />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={(v) => {
                              if (v === '__custom__') {
                                setIsCustomCategory(true);
                                field.onChange('__custom__');
                              } else {
                                setIsCustomCategory(false);
                                setCustomCategoryName('');
                                field.onChange(v);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {(categories || []).map(cat => (
                                <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                              ))}
                              <SelectItem value="__custom__">➕ Create Custom Category</SelectItem>
                            </SelectContent>
                          </Select>
                          {isCustomCategory && (
                            <Input
                              placeholder="Enter new category name"
                              value={customCategoryName}
                              onChange={(e) => setCustomCategoryName(e.target.value)}
                              className="mt-2"
                            />
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="tags" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags <span className="text-muted-foreground text-xs">(comma separated)</span></FormLabel>
                          <FormControl><Input {...field} placeholder="pets, health, tips" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>

                  {/* Featured Image */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-medium">Featured Image</p>
                      {featuredImage ? (
                        <div className="relative">
                          <img src={featuredImage} alt="Featured" className="w-full aspect-video object-cover rounded-lg" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => setFeaturedImage(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={onDrop}
                          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">
                            {uploading ? 'Uploading...' : 'Drop image or click to upload'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Submit */}
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 gap-1.5" disabled={createArticle.isPending || updateArticle.isPending}>
                      <Save className="h-4 w-4" />
                      {isEditing ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </AdminLayout>
  );
};

export default AdminCMSEditor;
