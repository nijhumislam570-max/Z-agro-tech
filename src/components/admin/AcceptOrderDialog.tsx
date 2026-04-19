import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { createOrderNotification } from '@/lib/notifications';
import { acceptOrderSchema } from '@/lib/validations/orderActions';

interface AcceptOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    user_id: string;
    total_amount: number;
  } | null;
}

export const AcceptOrderDialog = ({ isOpen, onClose, order }: AcceptOrderDialogProps) => {
  const [trackingId, setTrackingId] = useState('');
  const [consignmentId, setConsignmentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleAccept = async () => {
    if (!order) return;

    const parsed = acceptOrderSchema.safeParse({ trackingId, consignmentId });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          tracking_id: parsed.data.trackingId,
          consignment_id: parsed.data.consignmentId || null,
        })
        .eq('id', order.id);

      if (error) throw error;

      await createOrderNotification({
        userId: order.user_id,
        orderId: order.id,
        status: 'processing',
        orderTotal: order.total_amount,
      });

      toast.success('Order accepted and tracking ID added');

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      handleClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept order';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTrackingId('');
    setConsignmentId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Accept Order
          </DialogTitle>
          <DialogDescription>
            Enter the Steadfast tracking information to accept this order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trackingId">Tracking ID (Steadfast) *</Label>
            <Input
              id="trackingId"
              placeholder="e.g., 15BAEB8A"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.slice(0, 64))}
              disabled={isSubmitting}
              maxLength={64}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consignmentId">Consignment ID (Optional)</Label>
            <Input
              id="consignmentId"
              placeholder="e.g., 1424107"
              value={consignmentId}
              onChange={(e) => setConsignmentId(e.target.value.slice(0, 64))}
              disabled={isSubmitting}
              maxLength={64}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
