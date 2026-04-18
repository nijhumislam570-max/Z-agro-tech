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
import { Plus, Trash2, Pencil, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import type { Course } from '@/hooks/useCourses';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface FormState {
  title: string;
  description: string;
  price: string;
  thumbnail_url: string;
  video_url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
}

const empty: FormState = {
  title: '',
  description: '',
  price: '0',
  thumbnail_url: '',
  video_url: '',
  difficulty: 'beginner',
  is_active: true,
};

const AdminCourses = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Course[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        price: Number(form.price) || 0,
        thumbnail_url: form.thumbnail_url || null,
        video_url: form.video_url || null,
        difficulty: form.difficulty,
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
      price: String(c.price),
      thumbnail_url: c.thumbnail_url ?? '',
      video_url: c.video_url ?? '',
      difficulty: c.difficulty,
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
            <p className="text-sm text-muted-foreground">Manage Z Agro Academy course catalog.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New course</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? 'Edit course' : 'Create course'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <Label htmlFor="thumb">Thumbnail URL</Label>
                  <Input id="thumb" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="video">Video URL</Label>
                  <Input id="video" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="active" className="text-sm">Active</Label>
                    <p className="text-xs text-muted-foreground">Visible to learners</p>
                  </div>
                  <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
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
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="capitalize">{c.difficulty}</Badge>
                    <span className="text-muted-foreground">৳{c.price}</span>
                  </div>
                  {c.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
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
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
