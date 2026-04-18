import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, PhoneCall, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnroll } from '@/hooks/useEnrollments';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import type { Course } from '@/hooks/useCourses';
import type { CourseBatch } from '@/hooks/useCourseBatches';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  course: Course;
  batch: CourseBatch | null;
}

export const EnrollDialog = ({ open, onOpenChange, course, batch }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const enroll = useEnroll();
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Reset success state whenever the dialog re-opens
  useEffect(() => {
    if (open) setSubmitted(false);
  }, [open]);

  const waUrl = buildWhatsAppUrl({
    number: course.whatsapp_number,
    courseTitle: course.title,
    batchName: batch?.name ?? null,
    customMessage: course.whatsapp_message,
  });

  const handleWhatsApp = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  const handleCallback = async () => {
    if (!user) {
      onOpenChange(false);
      navigate(`/auth?redirect=${encodeURIComponent(`/course/${course.id}`)}`);
      return;
    }
    if (!phone.trim()) return;
    await enroll.mutateAsync({
      courseId: course.id,
      batchId: batch?.id ?? null,
      contactPhone: phone.trim(),
      notes: notes.trim() || null,
    });
    setPhone(''); setNotes('');
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Request received</DialogTitle>
              <DialogDescription>
                We'll reach out shortly to confirm your enrollment in <span className="font-medium text-foreground">{course.title}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl bg-success/10 border border-success/30 p-5 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
              </div>
              <p className="text-sm text-foreground">
                Your callback request was submitted. You can track the status in your dashboard.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
              <Button
                onClick={() => { onOpenChange(false); navigate('/dashboard'); }}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" /> Go to dashboard
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enroll in {course.title}</DialogTitle>
              <DialogDescription>
                {batch
                  ? <>Selected batch: <span className="font-medium text-foreground">{batch.name}</span></>
                  : 'Continue on WhatsApp for the next available batch.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Button onClick={handleWhatsApp} size="lg" className="w-full gap-2 bg-success hover:bg-success/90">
                <MessageCircle className="h-4 w-4" /> Continue on WhatsApp
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-primary" /> Request a callback
                </p>
                <div>
                  <Label htmlFor="phone" className="text-xs">Your phone number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+8801XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    placeholder="Anything we should know?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                variant="secondary"
                onClick={handleCallback}
                disabled={(!!user && !phone.trim()) || enroll.isPending}
              >
                {enroll.isPending ? 'Sending…' : user ? 'Request callback' : 'Sign in to continue'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnrollDialog;

