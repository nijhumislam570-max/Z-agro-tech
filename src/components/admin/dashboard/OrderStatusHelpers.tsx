import { CheckCircle2, Truck, XCircle } from 'lucide-react';

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
    case 'completed':
      return 'bg-success-light text-success';
    case 'processing':
      return 'bg-info-light text-info';
    case 'pending':
      return 'bg-warning-light text-warning-foreground';
    case 'shipped':
      return 'bg-info-light text-info';
    case 'cancelled':
    case 'rejected':
      return 'bg-danger-light text-danger';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'shipped':
      return <Truck className="h-3.5 w-3.5" />;
    case 'cancelled':
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return null;
  }
};
