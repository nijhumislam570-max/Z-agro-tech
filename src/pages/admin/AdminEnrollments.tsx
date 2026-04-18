import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Search, Phone, Inbox, Filter, BookOpen, X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { EnrollmentsSkeleton } from '@/components/admin/EnrollmentsSkeleton';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import { toast } from 'sonner';

type EnrollmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  batch_id: string | null;
  status: string | null;
  contact_phone: string | null;
  notes: string | null;
  progress: number;
  enrolled_at: string;
  course: { id: string; title: string } | null;
  batch: { id: string; name: string } | null;
  profile: { full_name: string | null; phone: string | null } | null;
}

const statusVariant: Record<EnrollmentStatus, string> = {
  pending: 'bg-warning-light text-warning-foreground dark:bg-warning-light/30 dark:text-warning',
  confirmed: 'bg-info-light text-info dark:bg-info-light/30 dark:text-info',
  completed: 'bg-success-light text-success dark:bg-success-light/30 dark:text-success',
  cancelled: 'bg-danger-light text-danger dark:bg-danger-light/30 dark:text-danger',
};

const AdminEnrollmentsContent = () => {
  useDocumentTitle('Enrollments - Admin');
  const { isAdmin } = useAdmin();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id, user_id, course_id, batch_id, status, contact_phone, notes, progress, enrolled_at,
          course:courses(id, title),
          batch:course_batches(id, name)
        `)
        .order('enrolled_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const userIds = [...new Set((data || []).map((e: any) => e.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase
            .from('profiles')
            .select('user_id, full_name, phone')
            .in('user_id', userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return (data || []).map((row: any): EnrollmentRow => ({
        ...row,
        profile: profileMap.get(row.user_id) ?? null,
      }));
    },
    enabled: isAdmin,
  });

  const filtered = useMemo(() => {
    let list = enrollments;
    if (statusFilter !== 'all') {
      list = list.filter((e) => (e.status || 'pending') === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.profile?.full_name?.toLowerCase().includes(q) ||
          e.contact_phone?.toLowerCase().includes(q) ||
          e.profile?.phone?.toLowerCase().includes(q) ||
          e.course?.title?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [enrollments, search, statusFilter]);

  const stats = useMemo(() => {
    const counts = { total: enrollments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    enrollments.forEach((e) => {
      const s = (e.status || 'pending') as EnrollmentStatus;
      if (s in counts) counts[s] += 1;
    });
    return counts;
  }, [enrollments]);

  const updateStatus = async (id: string, status: EnrollmentStatus) => {
    const { error } = await supabase.from('enrollments').update({ status }).eq('id', id);
    if (error) {
      toast.error('Failed to update status');
      return;
    }
    toast.success(`Enrollment marked as ${status}`);
    queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
  };

  // Clear selection whenever filters change so stale IDs don't linger
  useEffect(() => {
    setSelected(new Set());
  }, [search, statusFilter]);

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const someVisibleSelected = filtered.some((r) => selected.has(r.id)) && !allVisibleSelected;

  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) filtered.forEach((r) => next.add(r.id));
      else filtered.forEach((r) => next.delete(r.id));
      return next;
    });
  };

  const bulkUpdate = async (status: EnrollmentStatus) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from('enrollments').update({ status }).in('id', ids);
    setBulkLoading(false);
    if (error) {
      toast.error('Bulk update failed');
      return;
    }
    toast.success(`${ids.length} enrollment${ids.length > 1 ? 's' : ''} marked as ${status}`);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
  };

  return (
    <AdminLayout title="Enrollments" subtitle="Manage course enrollments and student progress">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {([
          { key: 'all', label: 'Total', value: stats.total, color: 'from-primary/10 to-accent/10' },
          { key: 'pending', label: 'Pending', value: stats.pending, color: 'from-warning-soft to-warning-soft/50 dark:from-warning-soft/30 dark:to-warning-soft/20' },
          { key: 'confirmed', label: 'Confirmed', value: stats.confirmed, color: 'from-info-soft to-info-soft/50 dark:from-info-soft/30 dark:to-info-soft/20' },
          { key: 'completed', label: 'Completed', value: stats.completed, color: 'from-success-soft to-success-soft/50 dark:from-success-soft/30 dark:to-success-soft/20' },
          { key: 'cancelled', label: 'Cancelled', value: stats.cancelled, color: 'from-danger-soft to-danger-soft/50 dark:from-danger-soft/30 dark:to-danger-soft/20' },
        ] as const).map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key as EnrollmentStatus | 'all')}
            className={`text-left rounded-xl border p-3 transition-all bg-gradient-to-br ${s.color} ${
              statusFilter === s.key ? 'ring-2 ring-primary/50' : 'hover:shadow-sm'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {s.label}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name, phone, or course..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EnrollmentStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-[160px] h-10 sm:h-11 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5 shadow-sm backdrop-blur">
          <span className="text-xs sm:text-sm font-medium text-foreground px-1">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={bulkLoading}
              onClick={() => bulkUpdate('confirmed')}
            >
              {bulkLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={bulkLoading}
              onClick={() => bulkUpdate('completed')}
            >
              Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-danger hover:text-danger"
              disabled={bulkLoading}
              onClick={() => bulkUpdate('cancelled')}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              disabled={bulkLoading}
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <EnrollmentsSkeleton />
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="text-center py-16 px-4">
              {(() => {
                const hasFilters = search || statusFilter !== 'all';
                if (hasFilters) {
                  return (
                    <>
                      <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium text-foreground mb-1">No matching enrollments</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Try adjusting your search or status filter.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchInput('');
                          setStatusFilter('all');
                        }}
                      >
                        Clear filters
                      </Button>
                    </>
                  );
                }
                if (enrollments.length === 0) {
                  return (
                    <>
                      <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium text-foreground mb-1">No enrollments yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once students enroll in courses, they'll appear here.
                      </p>
                      <Button asChild size="sm">
                        <Link to="/admin/courses">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Manage courses
                        </Link>
                      </Button>
                    </>
                  );
                }
                return (
                  <>
                    <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No enrollments found</p>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {filtered.map((row) => {
                const status = (row.status || 'pending') as EnrollmentStatus;
                return (
                  <div key={row.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {row.profile?.full_name || 'Unnamed Student'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {row.course?.title || 'Course removed'}
                        </p>
                        {row.batch?.name && (
                          <p className="text-[11px] text-muted-foreground">Batch: {row.batch.name}</p>
                        )}
                      </div>
                      <Badge className={statusVariant[status]}>{status}</Badge>
                    </div>
                    {(row.contact_phone || row.profile?.phone) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {row.contact_phone || row.profile?.phone}
                      </p>
                    )}
                    <Select value={status} onValueChange={(v) => updateStatus(row.id, v as EnrollmentStatus)}>
                      <SelectTrigger className="h-9 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const status = (row.status || 'pending') as EnrollmentStatus;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.profile?.full_name || 'Unnamed'}
                        </TableCell>
                        <TableCell>{row.course?.title || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.batch?.name || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.contact_phone || row.profile?.phone || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(row.enrolled_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={status}
                            onValueChange={(v) => updateStatus(row.id, v as EnrollmentStatus)}
                          >
                            <SelectTrigger className="h-8 w-[140px] text-xs rounded-lg">
                              <SelectValue>
                                <Badge className={statusVariant[status]}>{status}</Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

const AdminEnrollments = () => (
  <RequireAdmin>
    <AdminEnrollmentsContent />
  </RequireAdmin>
);

export default AdminEnrollments;
