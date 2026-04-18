import { memo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Building2, MessageSquare, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface QuickActionsCardProps {
  stats: {
    pendingOrders?: number;
    verifiedClinics?: number;
    totalClinics?: number;
    pendingDoctors?: number;
    postsToday?: number;
  } | undefined;
}

export const QuickActionsCard = memo(forwardRef<HTMLDivElement, QuickActionsCardProps>(({ stats }, ref) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Pending Orders',
      icon: Clock,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
      badgeText: stats?.pendingOrders || 0,
      onClick: () => navigate('/admin/orders?status=pending'),
    },
    {
      label: 'Manage Clinics',
      icon: Building2,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
      badgeText: `${stats?.verifiedClinics || 0}/${stats?.totalClinics || 0}`,
      onClick: () => navigate('/admin/clinics'),
    },
    {
      label: 'Doctor Verifications',
      icon: Stethoscope,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-500/10',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800',
      badgeText: `${stats?.pendingDoctors || 0} pending`,
      onClick: () => navigate('/admin/doctors'),
    },
    {
      label: 'Moderate Social',
      icon: MessageSquare,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800',
      badgeText: `${stats?.postsToday || 0} new`,
      onClick: () => navigate('/admin/social'),
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
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${action.bgColor} flex items-center justify-center flex-shrink-0`}>
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
}));

QuickActionsCard.displayName = 'QuickActionsCard';
