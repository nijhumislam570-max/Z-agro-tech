import { memo } from 'react';
import { GraduationCap, Users, Clock, Award } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

interface AcademyOverviewProps {
  stats: {
    totalCourses?: number;
    totalEnrollments?: number;
    pendingEnrollments?: number;
    confirmedEnrollments?: number;
    completedEnrollments?: number;
  } | undefined;
}

export const AcademyOverview = memo(({ stats }: AcademyOverviewProps) => {
  const total = stats?.totalEnrollments || 0;
  const completed = stats?.completedEnrollments || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const active = (stats?.confirmedEnrollments || 0) + (stats?.pendingEnrollments || 0);

  return (
    <div className="mb-4 sm:mb-6">
      <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">
        Academy Overview
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 min-h-[88px] sm:min-h-[100px] lg:min-h-[112px]">
        <StatCard
          title="Active Courses"
          value={stats?.totalCourses || 0}
          icon={<GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          href="/admin/courses"
          className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 dark:from-primary/5 dark:to-primary/5 dark:border-primary/40"
        />
        <StatCard
          title="Active Enrollments"
          value={active}
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-info" />}
          description={`${stats?.totalEnrollments || 0} total`}
          href="/admin/enrollments"
          className="bg-gradient-to-br from-info-soft to-info-soft/50 border-info-border dark:from-info-soft/30 dark:to-info-soft/20 dark:border-info-border/50"
        />
        <StatCard
          title="Pending Review"
          value={stats?.pendingEnrollments || 0}
          icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning-foreground" />}
          href="/admin/enrollments?status=pending"
          className="bg-gradient-to-br from-warning-soft to-warning-soft/50 border-warning-border dark:from-warning-soft/30 dark:to-warning-soft/20 dark:border-warning-border/50"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={<Award className="h-4 w-4 sm:h-5 sm:w-5 text-success" />}
          description={`${completed} completed`}
          href="/admin/enrollments?status=completed"
          className="bg-gradient-to-br from-success-soft to-success-soft/50 border-success-border dark:from-success-soft/30 dark:to-success-soft/20 dark:border-success-border/50"
        />
      </div>
    </div>
  );
});

AcademyOverview.displayName = 'AcademyOverview';
