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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Save, X, Pencil, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import {
  useCourseBatches, useUpsertBatch, useDeleteBatch, type CourseBatch, type BatchStatus,
} from '@/hooks/useCourseBatches';
import { batchUpsertSchema } from '@/lib/validations/courseActions';

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
  const { data: batches, isLoading, isError, refetch } = useCourseBatches(courseId);
  const upsert = useUpsertBatch();
  const del = useDeleteBatch();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseBatch | null>(null);

  const save = async () => {
    if (!draft) return;
    try {
      const parsed = batchUpsertSchema.parse({
        id: draft.id,
        course_id: courseId,
        name: draft.name,
        start_date: draft.start_date || null,
        end_date: draft.end_date || null,
        total_seats: Number(draft.total_seats) || 0,
        status: draft.status,
      });
      await upsert.mutateAsync(parsed);
      setDraft(null);
    } catch (err) {
      if (err instanceof ZodError) {
        toast.error(err.issues[0]?.message ?? 'Invalid batch data');
      } else if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Batches</h4>
        {!draft && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 min-h-[44px]"
            onClick={() => setDraft(emptyDraft())}
          >
            <Plus className="h-3.5 w-3.5" /> Add batch
          </Button>
        )}
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-destructive font-medium">Failed to load batches.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

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
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && batches?.length === 0 && !draft && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">
                  No batches yet.
                </TableCell>
              </TableRow>
            )}
            {batches?.map((b) => (
              draft?.id === b.id ? null : (
                <TableRow key={b.id}>
                  <TableCell className="text-sm">{b.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.start_date ?? '—'}</TableCell>
                  <TableCell className="text-xs">{b.enrolled_count}/{b.total_seats}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">{b.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={() => setDraft(fromBatch(b))}
                        aria-label={`Edit batch ${b.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(b)}
                        aria-label={`Delete batch ${b.name}`}
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
                  <Input
                    value={draft.name}
                    placeholder="Batch 12"
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="h-9 text-sm"
                    maxLength={80}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={draft.start_date}
                    onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
                    className="h-9 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    value={draft.total_seats}
                    onChange={(e) => setDraft({ ...draft, total_seats: e.target.value })}
                    className="h-9 text-sm w-20"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={draft.status}
                    onValueChange={(v) => setDraft({ ...draft, status: v as BatchStatus })}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="default"
                      className="h-9 w-9"
                      onClick={save}
                      disabled={!draft.name.trim() || upsert.isPending}
                      aria-label="Save batch"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => setDraft(null)}
                      aria-label="Cancel edit"
                    >
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
            <Input
              type="date"
              value={draft.end_date}
              onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
              className="h-9"
            />
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove batch{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>.
              {deleteTarget && deleteTarget.enrolled_count > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: {deleteTarget.enrolled_count} learner(s) are enrolled in this batch.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) {
                  del.mutate(
                    { id: deleteTarget.id, course_id: courseId },
                    { onSuccess: () => setDeleteTarget(null) },
                  );
                }
              }}
              disabled={del.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending ? 'Deleting…' : 'Delete batch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseBatchesTable;
