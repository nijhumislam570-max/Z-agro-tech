import { useState } from 'react';
import { Package, Truck, MapPin, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface TrackingStep {
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'upcoming';
}

interface OrderTrackingTimelineProps {
  orderId: string;
  trackingId: string | null;
  consignmentId: string | null;
  orderStatus: string;
  compact?: boolean;
}

const STEADFAST_STATUS_MAP: Record<string, string> = {
  'in_review': 'processing',
  'pending': 'processing',
  'delivered_approval_pending': 'delivered',
  'partial_delivered_approval_pending': 'delivered',
  'cancelled_approval_pending': 'cancelled',
  'unknown_approval_pending': 'processing',
  'delivered': 'delivered',
  'partial_delivered': 'delivered',
  'cancelled': 'cancelled',
  'hold': 'processing',
  'in_transit': 'shipped',
  'out_for_delivery': 'shipped',
};

export function OrderTrackingTimeline({ orderId, trackingId, consignmentId, orderStatus, compact = false }: OrderTrackingTimelineProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const queryClient = useQueryClient();

  const fetchTracking = async () => {
    if (!consignmentId && !trackingId) return;
    setIsTracking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const action = consignmentId ? 'track_by_consignment' : 'track_by_tracking_code';
      const params = consignmentId
        ? { action, consignment_id: consignmentId }
        : { action, tracking_code: trackingId };

      const response = await supabase.functions.invoke('steadfast', { body: params });
      
      if (response.error) throw new Error(response.error.message);

      const result = response.data;
      setTrackingData(result);

      const deliveryStatus = result?.delivery_status;
      if (deliveryStatus && STEADFAST_STATUS_MAP[deliveryStatus]) {
        const mappedStatus = STEADFAST_STATUS_MAP[deliveryStatus];
        if (mappedStatus !== orderStatus && mappedStatus === 'delivered') {
          await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          toast.success('Order auto-marked as delivered based on courier status');
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch tracking';
      toast.error(msg);
    } finally {
      setIsTracking(false);
    }
  };

  const getSteps = (): TrackingStep[] => {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(orderStatus);

    return [
      { label: 'Order Placed', icon: Package, status: currentIdx >= 0 ? 'completed' : 'upcoming' },
      { label: 'Processing', icon: Loader2, status: currentIdx > 0 ? 'completed' : currentIdx === 0 ? 'current' : 'upcoming' },
      { label: 'Shipped', icon: Truck, status: currentIdx > 2 ? 'completed' : currentIdx === 2 ? 'current' : 'upcoming' },
      { label: 'Delivered', icon: CheckCircle, status: currentIdx >= 3 ? 'completed' : 'upcoming' },
    ];
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {(consignmentId || trackingId) && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-lg gap-1.5"
            onClick={(e) => { e.stopPropagation(); fetchTracking(); }}
            disabled={isTracking}
          >
            {isTracking ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
            Track
          </Button>
        )}
        {trackingData?.delivery_status && (
          <Badge variant="outline" className="text-xs capitalize">
            {trackingData.delivery_status.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>
    );
  }

  const steps = getSteps();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Delivery Tracking</p>
        {(consignmentId || trackingId) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={fetchTracking}
            disabled={isTracking}
          >
            {isTracking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh
          </Button>
        )}
      </div>

      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                  step.status === 'completed' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                  step.status === 'current' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-400/50',
                  step.status === 'upcoming' && 'bg-muted text-muted-foreground',
                )}>
                  <Icon className={cn('h-4 w-4', step.status === 'current' && step.label === 'Processing' && 'animate-spin')} />
                </div>
                <span className={cn(
                  'text-[10px] font-medium whitespace-nowrap',
                  step.status === 'completed' && 'text-green-600 dark:text-green-400',
                  step.status === 'current' && 'text-blue-600 dark:text-blue-400',
                  step.status === 'upcoming' && 'text-muted-foreground',
                )}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-1 rounded-full',
                  step.status === 'completed' ? 'bg-green-400 dark:bg-green-600' : 'bg-muted',
                )} />
              )}
            </div>
          );
        })}
      </div>

      {trackingData && (
        <div className="p-2.5 bg-muted/50 rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Courier Status:</span>
            <Badge variant="outline" className="text-xs capitalize">
              {trackingData.delivery_status?.replace(/_/g, ' ') || 'Unknown'}
            </Badge>
          </div>
          {trackingData.updated_at && (
            <p className="text-muted-foreground">
              Last updated: {new Date(trackingData.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
