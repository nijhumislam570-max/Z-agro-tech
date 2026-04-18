import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { 
  TrendingUp, TrendingDown, CalendarClock, Clock, 
  CheckCircle, XCircle, Users, DollarSign, HeartPulse
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  appointment_date: string;
  status: string | null;
}

interface QuickStatsOverviewProps {
  appointments: Appointment[];
  doctorsCount: number;
  servicesCount: number;
}

const QuickStatsOverview = ({ appointments, doctorsCount, servicesCount }: QuickStatsOverviewProps) => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Calculate stats
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  
  // This week's stats
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const thisWeekAppointments = appointments.filter(a => {
    const date = parseISO(a.appointment_date);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  });
  
  // This month's stats
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const thisMonthAppointments = appointments.filter(a => {
    const date = parseISO(a.appointment_date);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  });
  
  // Completion rate
  const totalProcessed = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').length;
  const completionRate = totalProcessed > 0 
    ? Math.round((completedAppointments.length / totalProcessed) * 100) 
    : 0;

  const stats = [
    {
      title: 'Today',
      value: todayAppointments.length,
      subtitle: 'appointments',
      icon: CalendarClock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Pending',
      value: pendingAppointments.length,
      subtitle: 'to review',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      alert: pendingAppointments.length > 5,
    },
    {
      title: 'This Week',
      value: thisWeekAppointments.length,
      subtitle: 'appointments',
      icon: HeartPulse,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'This Month',
      value: thisMonthAppointments.length,
      subtitle: 'appointments',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Completed',
      value: completedAppointments.length,
      subtitle: 'total',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Success Rate',
      value: `${completionRate}%`,
      subtitle: 'completion',
      icon: TrendingUp,
      color: completionRate >= 80 ? 'text-emerald-600' : completionRate >= 50 ? 'text-amber-600' : 'text-red-600',
      bgColor: completionRate >= 80 ? 'bg-emerald-500/10' : completionRate >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index}
            className={cn(
              "relative overflow-hidden transition-all hover:shadow-md active:scale-[0.98]",
              stat.alert && "ring-2 ring-amber-500/50"
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0", stat.bgColor)}>
                  <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", stat.color)} />
                </div>
              </div>
              {stat.alert && (
                <div className="absolute top-1 right-1">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickStatsOverview;
