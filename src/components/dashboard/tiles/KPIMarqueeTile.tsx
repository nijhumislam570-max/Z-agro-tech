import { GlassCard } from '../GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Package, BookOpenCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardKPIs } from '@/hooks/useDashboardData';

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 min-w-[140px]">
      <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <div className="text-xs text-white/70 font-medium">{label}</div>
        <div className="text-xl font-bold text-white leading-tight">{value}</div>
      </div>
    </div>
  );
}

export default function KPIMarqueeTile() {
  const { user } = useAuth();
  const { isLoading, activeCourses, recentOrdersCount, lessonsInProgress } = useDashboardKPIs();

  const greetingName = user?.email?.split('@')[0] ?? 'Farmer';

  return (
    <GlassCard tone="strong" className="col-span-1 lg:col-span-8 overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Your Farm Hub
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Welcome back, {greetingName}
          </h2>
          <p className="text-sm text-white/80">
            Personalized inputs and learning for your farm.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-36 rounded-xl bg-white/20" />
              <Skeleton className="h-16 w-36 rounded-xl bg-white/20" />
              <Skeleton className="h-16 w-36 rounded-xl bg-white/20" />
            </>
          ) : (
            <>
              <StatChip icon={GraduationCap} label="Active Courses" value={activeCourses} />
              <StatChip icon={Package} label="Recent Orders" value={recentOrdersCount} />
              <StatChip icon={BookOpenCheck} label="In Progress" value={lessonsInProgress} />
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
