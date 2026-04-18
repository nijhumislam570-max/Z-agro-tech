import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useCourseBatches, useUpsertBatch, useDeleteBatch, type CourseBatch, type BatchStatus } from '@/hooks/useCourseBatches';

const STATUSES: BatchStatus[] = ['open', 'filling', 'closed', 'completed'];

interface Draft {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  total_seats: string;
  status: BatchStatus;
}

const emptyDraft = (): Draft => ({
  name: '', start_date: '', end_date: '', total_seats: '30', status: 'open',
});

const fromBatch = (b: CourseBatch): Draft => ({
  id: b.id,
  name: b.name,
  start_date: b.start_date ?? '',
  end_date: b.end_date ?? '',
  total_seats: String(b.total_seats),
  status: b.status,
});

export const CourseBatchesTable = ({ courseId }: { courseId: string }) => {
  const { data: batches, isLoading } = useCourseBatches(courseId);
  const upsert = useUpsertBatch();
  const del = useDeleteBatch();
  const [draft, setDraft] = useState<Draft | null>(null);

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    await upsert.mutateAsync({
      id: draft.id,
      course_id: courseId,
      name: draft.name.trim(),
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
      total_seats: Number(draft.total_seats) || 0,
      status: draft.status,
    });
    setDraft(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Batches</h4>
        {!draft && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDraft(emptyDraft())}>
            <Plus className="h-3.5 w-3.5" /> Add batch
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Start</TableHead>
              <TableHead className="text-xs">Seats</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">Loading…</TableCell></TableRow>
            )}
            {!isLoading && batches?.length === 0 && !draft && (
              <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">No batches yet.</TableCell></TableRow>
            )}
            {batches?.map((b) => (
              draft?.id === b.id ? null : (
                <TableRow key={b.id}>
                  <TableCell className="text-sm">{b.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.start_date ?? '—'}</TableCell>
                  <TableCell className="text-xs">{b.enrolled_count}/{b.total_seats}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize text-xs">{b.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDraft(fromBatch(b))}>
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm(`Delete batch "${b.name}"?`)) del.mutate({ id: b.id, course_id: courseId }); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            ))}
            {draft && (
              <TableRow className="bg-primary/5">
                <TableCell>
                  <Input value={draft.name} placeholder="Batch 12" onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-8 text-sm" />
                </TableCell>
                <TableCell>
                  <Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} className="h-8 text-xs" />
                </TableCell>
                <TableCell>
                  <Input type="number" min="1" value={draft.total_seats} onChange={(e) => setDraft({ ...draft, total_seats: e.target.value })} className="h-8 text-sm w-20" />
                </TableCell>
                <TableCell>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as BatchStatus })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="default" className="h-7 w-7" onClick={save} disabled={!draft.name.trim() || upsert.isPending}>
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDraft(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {draft && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">End date (optional)</Label>
            <Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} className="h-8" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseBatchesTable;
