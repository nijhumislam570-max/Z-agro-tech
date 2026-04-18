import { memo } from 'react';
import { ShieldCheck, Building2, MessageCircleHeart, CalendarClock, Stethoscope, FileText } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

interface PlatformOverviewProps {
  stats: {
    totalDoctors?: number;
    pendingDoctors?: number;
    totalClinics?: number;
    verifiedClinics?: number;
    totalAppointments?: number;
    appointmentsToday?: number;
    totalPosts?: number;
    postsToday?: number;
    totalUsers?: number;
    totalArticles?: number;
    draftArticles?: number;
    publishedThisMonth?: number;
  } | undefined;
}

export const PlatformOverview = memo(({ stats }: PlatformOverviewProps) => (
  <div className="mb-4 sm:mb-6">
    <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">
      Platform Overview
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 min-h-[88px] sm:min-h-[100px] lg:min-h-[112px]">
      <StatCard
        title="Doctors"
        value={stats?.totalDoctors || 0}
        icon={<Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />}
        description={`${stats?.pendingDoctors || 0} pending`}
        href="/admin/doctors"
        className="bg-gradient-to-br from-cyan-50 to-sky-50/50 border-cyan-100 dark:from-cyan-950/30 dark:to-sky-950/20 dark:border-cyan-900/50"
      />
      <StatCard
        title="Clinics"
        value={stats?.totalClinics || 0}
        icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />}
        description={`${stats?.verifiedClinics || 0} verified`}
        href="/admin/clinics"
        className="bg-gradient-to-br from-teal-50 to-cyan-50/50 border-teal-100 dark:from-teal-950/30 dark:to-cyan-950/20 dark:border-teal-900/50"
      />
      <StatCard
        title="Appointments"
        value={stats?.totalAppointments || 0}
        icon={<CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />}
        description={`${stats?.appointmentsToday || 0} today`}
        href="/admin/clinics"
        className="bg-gradient-to-br from-rose-50 to-pink-50/50 border-rose-100 dark:from-rose-950/30 dark:to-pink-950/20 dark:border-rose-900/50"
      />
      <StatCard
        title="Posts"
        value={stats?.totalPosts || 0}
        icon={<MessageCircleHeart className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />}
        description={`${stats?.postsToday || 0} today`}
        href="/admin/social"
        className="bg-gradient-to-br from-indigo-50 to-purple-50/50 border-indigo-100 dark:from-indigo-950/30 dark:to-purple-950/20 dark:border-indigo-900/50"
      />
      <StatCard
        title="Articles"
        value={stats?.totalArticles || 0}
        icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />}
        description={`${stats?.draftArticles || 0} drafts`}
        href="/admin/cms"
        className="bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50"
      />
      <StatCard
        title="Users"
        value={stats?.totalUsers || 0}
        icon={<ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />}
        description={`${stats?.totalUsers || 0} registered`}
        href="/admin/customers"
        className="bg-gradient-to-br from-orange-50 to-amber-50/50 border-orange-100 dark:from-orange-950/30 dark:to-amber-950/20 dark:border-orange-900/50"
      />
    </div>
  </div>
));

PlatformOverview.displayName = 'PlatformOverview';
