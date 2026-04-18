import { useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { createOrderNotification } from '@/lib/notifications';

interface RejectOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    user_id: string;
    total_amount: number;
  } | null;
}

export const RejectOrderDialog = ({ isOpen, onClose, order }: RejectOrderDialogProps) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleReject = async () => {
    if (!order) return;

    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          rejection_reason: reason.trim(),
        })
        .eq('id', order.id);

      if (error) throw error;

      await createOrderNotification({
        userId: order.user_id,
        orderId: order.id,
        status: 'cancelled',
        orderTotal: order.total_amount,
      });

      toast.success('Order rejected and user notified');

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      handleClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject order';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Reject Order
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this order. The customer will see this reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Out of stock, Invalid address, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
