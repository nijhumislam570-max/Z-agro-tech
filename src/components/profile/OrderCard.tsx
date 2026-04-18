import { memo } from 'react';
import { MapPin, Package, Truck, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface OrderCardProps {
  order: {
    id: string;
    items: OrderItem[];
    total_amount: number;
    status: string;
    shipping_address: string | null;
    created_at: string;
    tracking_id?: string | null;
    rejection_reason?: string | null;
  };
}

const OrderCard = memo(({ order }: OrderCardProps) => {
  const navigate = useNavigate();
  const items = Array.isArray(order.items) ? order.items as OrderItem[] : [];

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return { 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          icon: CheckCircle,
          step: 4
        };
      case 'shipped':
        return { 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          icon: Truck,
          step: 3
        };
      case 'processing':
        return { 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          icon: Package,
          step: 2
        };
      case 'pending':
        return { 
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          icon: Clock,
          step: 1
        };
      case 'cancelled':
        return { 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          icon: XCircle,
          step: 0
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground',
          icon: Clock,
          step: 1
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const isCancelled = order.status?.toLowerCase() === 'cancelled';

  return (
    <div className="border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300 bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), 'PPP')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={`${statusConfig.color} gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {order.status || 'Pending'}
          </Badge>
          <span className="text-xl font-bold text-primary">৳{order.total_amount.toLocaleString()}</span>
        </div>
      </div>

      {/* Progress Timeline */}
      {!isCancelled && statusConfig.step > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, index) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`h-2 w-2 rounded-full mb-1 ${
                  index < statusConfig.step ? 'bg-primary' : 'bg-muted'
                }`} />
                <span className={`text-xs ${
                  index < statusConfig.step ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(statusConfig.step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Product Images */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {items.slice(0, 4).map((item, idx) => (
            <div key={idx} className="relative group">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="h-16 w-16 object-cover rounded-lg border"
                  loading="lazy"
                  decoding="async"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              {item.quantity > 1 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.quantity}
                </span>
              )}
            </div>
          ))}
          {items.length > 4 && (
            <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">+{items.length - 4}</span>
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {items.slice(0, 3).map((item, idx) => (
            <span key={idx} className="text-xs bg-muted px-3 py-1.5 rounded-full">
              {item.name} × {item.quantity}
            </span>
          ))}
          {items.length > 3 && (
            <span className="text-xs bg-muted px-3 py-1.5 rounded-full">
              +{items.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="text-sm text-muted-foreground flex items-start gap-2 mb-4">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{order.shipping_address || 'No address provided'}</span>
      </div>

      {/* Rejection Reason */}
      {isCancelled && order.rejection_reason && (
        <div className="text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20 mb-4">
          <p className="text-muted-foreground text-xs mb-1">Rejection Reason:</p>
          <p className="text-destructive">{order.rejection_reason}</p>
        </div>
      )}

      {/* Tracking ID */}
      {order.tracking_id && (
        <div className="text-sm p-3 bg-secondary/50 rounded-lg mb-4">
          <p className="text-muted-foreground text-xs mb-1">Tracking ID (Steadfast):</p>
          <code className="font-mono font-bold">{order.tracking_id}</code>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {order.status?.toLowerCase() === 'delivered' && (
          <Button 
            size="sm" 
            variant="outline"
            className="gap-1"
            onClick={() => navigate('/shop')}
          >
            <RotateCcw className="h-3 w-3" />
            Reorder
          </Button>
        )}
        {(order.status?.toLowerCase() === 'shipped' || order.status?.toLowerCase() === 'processing') && order.tracking_id && (
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1"
            onClick={() => navigate(`/track-order?id=${order.id}`)}
          >
            <Truck className="h-3 w-3" />
            Track Order
          </Button>
        )}
      </div>
    </div>
  );
});

OrderCard.displayName = 'OrderCard';

export default OrderCard;
