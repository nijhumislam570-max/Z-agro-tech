import { CheckCircle2, Truck, XCircle } from 'lucide-react';

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'processing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
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
