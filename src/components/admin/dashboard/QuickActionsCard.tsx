import { memo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Package, GraduationCap, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface QuickActionsCardProps {
  stats: {
    pendingOrders?: number;
    totalProducts?: number;
  } | undefined;
}

export const QuickActionsCard = memo(
  forwardRef<HTMLDivElement, QuickActionsCardProps>(({ stats }, ref) => {
    const navigate = useNavigate();

    const actions = [
      {
        label: 'Pending Orders',
        icon: Clock,
        iconColor: 'text-warning-foreground',
        bgColor: 'bg-warning/10',
        badgeBg:
          'bg-warning-light text-warning-foreground border-warning-border dark:bg-warning-light/30 dark:text-warning dark:border-warning-border',
        badgeText: stats?.pendingOrders || 0,
        onClick: () => navigate('/admin/orders?status=pending'),
      },
      {
        label: 'Manage Products',
        icon: Package,
        iconColor: 'text-success',
        bgColor: 'bg-success/10',
        badgeBg:
          'bg-success-light text-success border-success-border dark:bg-success-light/30 dark:text-success dark:border-success-border',
        badgeText: `${stats?.totalProducts || 0} listed`,
        onClick: () => navigate('/admin/products'),
      },
      {
        label: 'Courses',
        icon: GraduationCap,
        iconColor: 'text-info',
        bgColor: 'bg-info/10',
        badgeBg:
          'bg-info-light text-info border-info-border dark:bg-info-light/30 dark:text-info dark:border-info-border',
        badgeText: 'Open',
        onClick: () => navigate('/admin/courses'),
      },
      {
        label: 'Contact Messages',
        icon: Mail,
        iconColor: 'text-accent',
        bgColor: 'bg-accent/10',
        badgeBg:
          'bg-accent/10 text-accent border-accent/30 dark:bg-purple-950/30 dark:text-accent dark:border-accent/30',
        badgeText: 'Inbox',
        onClick: () => navigate('/admin/messages'),
      },
    ];

    return (
      <Card ref={ref} className="shadow-sm border-border/50">
        <CardHeader className="p-3 sm:p-4 lg:p-5 pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-5 pt-0 space-y-1.5 sm:space-y-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-2.5"
              variant="outline"
              onClick={action.onClick}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${action.bgColor} flex items-center justify-center flex-shrink-0`}
              >
                <action.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${action.iconColor}`} />
              </div>
              <span className="flex-1 text-left text-xs sm:text-sm">{action.label}</span>
              <Badge variant="outline" className={`${action.badgeBg} text-[10px] sm:text-xs px-1.5 sm:px-2`}>
                {action.badgeText}
              </Badge>
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  }),
);

QuickActionsCard.displayName = 'QuickActionsCard';
