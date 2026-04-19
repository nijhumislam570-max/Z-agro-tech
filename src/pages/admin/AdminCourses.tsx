import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Plus, Trash2, Pencil, GraduationCap, CalendarDays, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  type Course, COURSE_CATEGORIES, COURSE_MODES,
} from '@/hooks/useCourses';
import { AdminLayout } from '@/components/admin/AdminLayout';
// Lazy — curriculum editor only renders inside the create/edit dialog
const CurriculumEditor = lazy(() =>
  import('@/components/admin/CurriculumEditor').then((m) => ({ default: m.CurriculumEditor })),
);
import { CourseBatchesTable } from '@/components/admin/CourseBatchesTable';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { courseFormSchema, type CourseFormData } from '@/lib/validations';

const defaultValues: CourseFormData = {
  title: '',
  description: '',
  audience: '',
  price: 0,
  thumbnail_url: '',
  video_url: '',
  difficulty: 'beginner',
  category: 'other',
  mode: 'online',
  duration_label: '',
  curriculum: [],
  whatsapp_number: '',
  whatsapp_message: '',
  provides_certificate: true,
  is_active: true,
};

const AdminCourses = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [batchesFor, setBatchesFor] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
  });

  const { data: courses, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-courses'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((row) => ({
        ...row,
        curriculum: Array.isArray((row as { curriculum?: unknown }).curriculum)
          ? ((row as { curriculum: unknown[] }).curriculum.filter((x): x is string => typeof x === 'string'))
          : [],
      })) as Course[];
    },
  });

  const save = useMutation({
    mutationFn: async (values: CourseFormData) => {
      const payload = {
        title: values.title,
        description: values.description || null,
        audience: values.audience || null,
        price: values.price,
        thumbnail_url: values.thumbnail_url || null,
        video_url: values.video_url || null,
        difficulty: values.difficulty,
        category: values.category,
        mode: values.mode,
        duration_label: values.duration_label || null,
        curriculum: values.curriculum,
        whatsapp_number: values.whatsapp_number || null,
        whatsapp_message: values.whatsapp_message || null,
        provides_certificate: values.provides_certificate,
        is_active: values.is_active,
        instructor_id: user?.id ?? null,
      };
      if (editing) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Course updated' : 'Course created');
      setOpen(false);
      setEditing(null);
      form.reset(defaultValues);
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save course'),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Course deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete course'),
  });

  const openEdit = (c: Course) => {
    setEditing(c);
    form.reset({
      title: c.title,
      description: c.description ?? '',
      audience: c.audience ?? '',
      price: Number(c.price) || 0,
      thumbnail_url: c.thumbnail_url ?? '',
      video_url: c.video_url ?? '',
      difficulty: c.difficulty,
      category: c.category,
      mode: c.mode,
      duration_label: c.duration_label ?? '',
      curriculum: c.curriculum ?? [],
      whatsapp_number: c.whatsapp_number ?? '',
      whatsapp_message: c.whatsapp_message ?? '',
      provides_certificate: c.provides_certificate,
      is_active: c.is_active,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    form.reset(defaultValues);
    setOpen(true);
  };

  const handleDialogChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEditing(null);
      form.reset(defaultValues);
    }
  };

  const onSubmit = (values: CourseFormData) => save.mutate(values);

  return (
    <AdminLayout title="Courses">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" /> Courses
            </h1>
            <p className="text-sm text-muted-foreground">Manage Z Agro Academy training cohorts.</p>
          </div>
          <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" /> New course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit course' : 'Create course'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audience tagline</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Farmers, agronomists, agri-entrepreneurs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea rows={4} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COURSE_CATEGORIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COURSE_MODES.map((m) => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="duration_label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl><Input placeholder="৩০ দিন" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (৳)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="curriculum"
                    render={({ field }) => (
                      <FormItem>
                        <Suspense fallback={<div className="h-32 rounded-md bg-muted/40 animate-pulse" />}>
                          <CurriculumEditor value={field.value} onChange={field.onChange} />
                        </Suspense>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thumbnail_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ''}
                            onChange={field.onChange}
                            bucket="course-thumbnails"
                            folder="courses"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promo video URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      WhatsApp enrollment
                    </p>
                    <FormField
                      control={form.control}
                      name="whatsapp_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Override number (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+8801763585500 (leave empty for global default)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsapp_message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Custom prefilled message (optional)</FormLabel>
                          <FormControl>
                            <Textarea rows={2} placeholder="Leave empty for the default enrollment message." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="provides_certificate"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3 space-y-0">
                          <div>
                            <FormLabel className="text-sm">Certificate</FormLabel>
                            <p className="text-xs text-muted-foreground">Provided on completion</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3 space-y-0">
                          <div>
                            <FormLabel className="text-sm">Active</FormLabel>
                            <p className="text-xs text-muted-foreground">Visible to learners</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => handleDialogChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={save.isPending}>
                      {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : isError ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
              <p className="text-sm text-destructive font-medium mb-3">
                Failed to load courses. Please check your connection.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        ) : !courses || courses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              No courses yet. Click "New course" to add the first one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{c.title}</CardTitle>
                    <Badge variant={c.is_active ? 'default' : 'secondary'}>
                      {c.is_active ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c.thumbnail_url && (
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                      <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="outline" className="capitalize">{c.difficulty}</Badge>
                    <Badge variant="outline" className="capitalize">{c.category.replace('_', ' ')}</Badge>
                    <Badge variant="outline" className="capitalize">{c.mode}</Badge>
                    {c.duration_label && <Badge variant="outline">{c.duration_label}</Badge>}
                    <span className="text-muted-foreground">৳{c.price}</span>
                  </div>
                  {c.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setBatchesFor(c)}>
                      <CalendarDays className="h-3.5 w-3.5" /> Batches
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(c)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={!!batchesFor} onOpenChange={(v) => !v && setBatchesFor(null)}>
          <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Batches</SheetTitle>
              <SheetDescription>
                Schedule cohorts for <span className="font-medium text-foreground">{batchesFor?.title}</span>.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              {batchesFor && <CourseBatchesTable courseId={batchesFor.id} />}
            </div>
          </SheetContent>
        </Sheet>

        <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete course?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <span className="font-semibold text-foreground">{deleteTarget?.title}</span>{' '}
                and any associated batches/enrollments references. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (deleteTarget) del.mutate(deleteTarget.id);
                }}
                disabled={del.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {del.isPending ? 'Deleting…' : 'Delete course'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
