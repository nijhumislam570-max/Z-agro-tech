import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Plus, Trash2, Pencil, GraduationCap, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import {
  type Course, type CourseCategory, type CourseMode,
  COURSE_CATEGORIES, COURSE_MODES,
} from '@/hooks/useCourses';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CurriculumEditor } from '@/components/admin/CurriculumEditor';
import { CourseBatchesTable } from '@/components/admin/CourseBatchesTable';

interface FormState {
  title: string;
  description: string;
  audience: string;
  price: string;
  thumbnail_url: string;
  video_url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: CourseCategory;
  mode: CourseMode;
  duration_label: string;
  curriculum: string[];
  whatsapp_number: string;
  whatsapp_message: string;
  provides_certificate: boolean;
  is_active: boolean;
}

const empty: FormState = {
  title: '',
  description: '',
  audience: '',
  price: '0',
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
  const [form, setForm] = useState<FormState>(empty);
  const [batchesFor, setBatchesFor] = useState<Course | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
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
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        audience: form.audience || null,
        price: Number(form.price) || 0,
        thumbnail_url: form.thumbnail_url || null,
        video_url: form.video_url || null,
        difficulty: form.difficulty,
        category: form.category,
        mode: form.mode,
        duration_label: form.duration_label || null,
        curriculum: form.curriculum,
        whatsapp_number: form.whatsapp_number || null,
        whatsapp_message: form.whatsapp_message || null,
        provides_certificate: form.provides_certificate,
        is_active: form.is_active,
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
      setOpen(false); setEditing(null); setForm(empty);
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Course deleted');
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description ?? '',
      audience: c.audience ?? '',
      price: String(c.price),
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

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };

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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New course</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? 'Edit course' : 'Create course'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="audience">Audience tagline</Label>
                  <Input
                    id="audience" placeholder="e.g. Farmers, agronomists, agri-entrepreneurs"
                    value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as CourseCategory })}>
                      <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COURSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mode">Mode</Label>
                    <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v as CourseMode })}>
                      <SelectTrigger id="mode"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COURSE_MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="duration">Duration label</Label>
                    <Input id="duration" placeholder="৩০ দিন" value={form.duration_label} onChange={(e) => setForm({ ...form, duration_label: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (৳)</Label>
                    <Input id="price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as FormState['difficulty'] })}>
                      <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <CurriculumEditor
                  value={form.curriculum}
                  onChange={(v) => setForm({ ...form, curriculum: v })}
                />

                <div>
                  <Label htmlFor="thumb">Thumbnail URL</Label>
                  <Input id="thumb" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp enrollment</p>
                  <div>
                    <Label htmlFor="wa-num" className="text-xs">Override number (optional)</Label>
                    <Input
                      id="wa-num" placeholder="+8801763585500 (leave empty to use global default)"
                      value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wa-msg" className="text-xs">Custom prefilled message (optional)</Label>
                    <Textarea
                      id="wa-msg" rows={2}
                      placeholder="Leave empty for the default enrollment message."
                      value={form.whatsapp_message} onChange={(e) => setForm({ ...form, whatsapp_message: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor="cert" className="text-sm">Certificate</Label>
                      <p className="text-xs text-muted-foreground">Provided on completion</p>
                    </div>
                    <Switch id="cert" checked={form.provides_certificate} onCheckedChange={(v) => setForm({ ...form, provides_certificate: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor="active" className="text-sm">Active</Label>
                      <p className="text-xs text-muted-foreground">Visible to learners</p>
                    </div>
                    <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={!form.title || save.isPending}>
                  {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
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
                      onClick={() => { if (confirm(`Delete "${c.title}"?`)) del.mutate(c.id); }}
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
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
