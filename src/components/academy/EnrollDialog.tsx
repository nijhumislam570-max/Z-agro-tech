import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { MessageCircle, PhoneCall, CheckCircle2, LayoutDashboard, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnroll } from '@/hooks/useEnrollments';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { enrollSchema, type EnrollFormData } from '@/lib/validations';
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
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<EnrollFormData>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      courseId: course.id,
      batchId: batch?.id ?? null,
      contactPhone: '',
      notes: '',
    },
    mode: 'onChange',
  });

  // Reset success + form whenever the dialog re-opens or the batch changes.
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      form.reset({
        courseId: course.id,
        batchId: batch?.id ?? null,
        contactPhone: '',
        notes: '',
      });
    }
  }, [open, course.id, batch?.id, form]);

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

  const onSubmit = async (values: EnrollFormData) => {
    if (!user) {
      onOpenChange(false);
      navigate(`/auth?redirect=${encodeURIComponent(`/course/${course.id}`)}`);
      return;
    }
    try {
      await enroll.mutateAsync({
        courseId: course.id,
        batchId: batch?.id ?? null,
        contactPhone: values.contactPhone?.trim() || null,
        notes: values.notes?.trim() || null,
      });
      setSubmitted(true);
    } catch {
      // toast handled inside useEnroll
    }
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Enroll in {course.title}</DialogTitle>
                <DialogDescription>
                  {batch
                    ? <>Selected batch: <span className="font-medium text-foreground">{batch.name}</span></>
                    : 'Continue on WhatsApp for the next available batch.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <Button
                  type="button"
                  onClick={handleWhatsApp}
                  size="lg"
                  className="w-full gap-2 bg-success hover:bg-success/90"
                >
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

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Your phone number *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            type="tel"
                            inputMode="tel"
                            placeholder="+8801XXXXXXXXX"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ''}
                            rows={2}
                            placeholder="Anything we should know?"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={enroll.isPending}
                  className="gap-2"
                >
                  {enroll.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {enroll.isPending ? 'Sending…' : user ? 'Request callback' : 'Sign in to continue'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnrollDialog;
