// Shared status color/badge utilities for order management.
// Uses semantic design tokens from index.css — never hardcode Tailwind palette colors here.
export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
    case 'completed':
      return 'bg-success-light text-success-foreground dark:text-success';
    case 'processing':
      return 'bg-info-light text-info-foreground dark:text-info';
    case 'pending':
      return 'bg-warning-light text-warning-foreground';
    case 'shipped':
      return 'bg-info-light text-info-foreground dark:text-info';
    case 'cancelled':
    case 'rejected':
      return 'bg-danger-light text-danger-foreground dark:text-danger';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getPaymentStatusColor = (status: string | null) => {
  switch (status) {
    case 'paid':
      return 'bg-success-light text-success-foreground dark:text-success';
    case 'refunded':
      return 'bg-warning-light text-warning-foreground';
    default:
      return '';
  }
};
