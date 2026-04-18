import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { getStatusColor, getStatusIcon } from './OrderStatusHelpers';

interface RecentOrdersListProps {
  orders: any[] | undefined;
  isLoading: boolean;
}

export const RecentOrdersList = memo(({ orders, isLoading }: RecentOrdersListProps) => {
  const navigate = useNavigate();

  return (
    <Card className="lg:col-span-2 shadow-sm border-border/50 min-h-[280px]">
      <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 lg:p-5 pb-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">Recent Orders</span>
          </CardTitle>
          <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm hidden sm:block">
            Latest customer orders
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/orders')}
          className="gap-1 text-xs sm:text-sm h-8 px-2 sm:px-3 flex-shrink-0"
        >
          <span className="hidden xs:inline">View All</span>
          <span className="xs:hidden">All</span>
          <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order: any) => (
              <div
                key={order.id}
                onClick={() => navigate('/admin/orders')}
                className="flex items-center justify-between p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-2 sm:gap-3 cursor-pointer group border border-transparent hover:border-border/50 active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm group-hover:text-primary transition-colors truncate">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <Badge className={`${getStatusColor(order.status)} text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5`}>
                    {getStatusIcon(order.status)}
                    <span className="hidden xs:inline">{order.status}</span>
                    <span className="xs:hidden">{order.status?.slice(0, 3)}</span>
                  </Badge>
                  <span className="font-bold text-primary text-xs sm:text-sm whitespace-nowrap">
                    ৳{order.total_amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

RecentOrdersList.displayName = 'RecentOrdersList';
