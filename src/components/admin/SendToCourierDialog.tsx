import { useState } from 'react';
import { Loader2, Truck, Zap, PenLine } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { createOrderNotification } from '@/lib/notifications';
import { parseShippingAddress } from '@/lib/fraudDetection';

interface SendToCourierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    user_id: string;
    total_amount: number;
    shipping_address: string | null;
    items?: unknown;
    payment_method?: string | null;
    profile?: { full_name: string | null; phone: string | null } | null;
  } | null;
}

export const SendToCourierDialog = ({ isOpen, onClose, order }: SendToCourierDialogProps) => {
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');
  const [trackingId, setTrackingId] = useState('');
  const [consignmentId, setConsignmentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const parsed = order?.shipping_address ? parseShippingAddress(order.shipping_address) : null;
  const customerName = order?.profile?.full_name || parsed?.name || 'Unknown';
  const customerPhone = order?.profile?.phone || parsed?.phone || '';
  const customerAddress = parsed?.addressParts?.join(', ') || order?.shipping_address || '';
  const codAmount = order?.payment_method === 'cod' ? order.total_amount : 0;

  const handleQuickShip = async () => {
    if (!order) return;
    if (!customerPhone) {
      toast.error('Customer phone number is missing. Use manual mode.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke('steadfast', {
        body: {
          action: 'create_order',
          invoice: order.id,
          recipient_name: customerName,
          recipient_phone: customerPhone,
          recipient_address: customerAddress,
          cod_amount: codAmount,
          note: `Order #${order.id.slice(0, 8)} - ${Array.isArray(order.items) ? order.items.length : 0} items`,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const result = response.data;
      
      if (result?.consignment?.tracking_code || result?.consignment?.consignment_id) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'processing',
            tracking_id: result.consignment.tracking_code || null,
            consignment_id: String(result.consignment.consignment_id) || null,
          })
          .eq('id', order.id);

        if (updateError) throw updateError;

        await createOrderNotification({
          userId: order.user_id,
          orderId: order.id,
          status: 'processing',
          orderTotal: order.total_amount,
        });

        toast.success(`Order sent to Steadfast. Tracking: ${result.consignment.tracking_code}`);
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        handleClose();
      } else if (result?.error || result?.errors) {
        const errMsg = result.errors ? Object.values(result.errors).flat().join(', ') : result.error || 'Courier rejected the order';
        throw new Error(errMsg);
      } else {
        throw new Error('Unexpected response from courier service');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send to courier';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualAccept = async () => {
    if (!order) return;
    if (!trackingId.trim()) {
      toast.error('Please enter the tracking ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          tracking_id: trackingId.trim(),
          consignment_id: consignmentId.trim() || null,
        })
        .eq('id', order.id);

      if (error) throw error;

      await createOrderNotification({
        userId: order.user_id,
        orderId: order.id,
        status: 'processing',
        orderTotal: order.total_amount,
      });

      toast.success('Tracking ID added successfully');
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
    setMode('quick');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5 text-primary" />
            Accept & Ship Order
          </DialogTitle>
          <DialogDescription className="text-sm">
            Send this order to Steadfast courier or enter tracking manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'quick' | 'manual')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="quick" className="text-xs sm:text-sm gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Quick Ship
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs sm:text-sm gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-3 mt-3">
            <div className="p-3 bg-muted/50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-medium text-right max-w-[60%] truncate">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{customerPhone || <span className="text-destructive">Missing!</span>}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium text-right max-w-[60%] line-clamp-2">{customerAddress || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border">
                <span className="text-muted-foreground">COD Amount:</span>
                <span className="font-bold text-primary">৳{codAmount}</span>
              </div>
            </div>

            <Button
              onClick={handleQuickShip}
              disabled={isSubmitting || !customerPhone}
              className="w-full h-11 gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending to Courier...</>
              ) : (
                <><Zap className="h-4 w-4" /> Send to Steadfast</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label htmlFor="manualTrackingId" className="text-sm">Tracking ID *</Label>
              <Input
                id="manualTrackingId"
                placeholder="e.g., 15BAEB8A"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                disabled={isSubmitting}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manualConsignmentId" className="text-sm">Consignment ID (Optional)</Label>
              <Input
                id="manualConsignmentId"
                placeholder="e.g., 1424107"
                value={consignmentId}
                onChange={(e) => setConsignmentId(e.target.value)}
                disabled={isSubmitting}
                className="h-10"
              />
            </div>

            <Button
              onClick={handleManualAccept}
              disabled={isSubmitting}
              className="w-full h-11 gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Accepting...</>
              ) : (
                'Accept Order'
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
