import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Wallet, GraduationCap, Heart, type LucideIcon } from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useDashboardData';
import { useWishlist } from '@/contexts/WishlistContext';

interface StatProps {
  label: string;
  value: string;
  icon: LucideIcon;
  to: string;
}

const StatCard = memo(({ label, value, icon: Icon, to }: StatProps) => (
  <Link
    to={to}
    className="group rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:bg-white/20 px-4 py-3.5 sm:px-5 sm:py-4 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/60"
  >
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] sm:text-xs text-white/75 font-medium uppercase tracking-wide truncate">
          {label}
        </div>
        <div className="text-xl sm:text-2xl font-display font-bold text-white leading-tight truncate">
          {value}
        </div>
      </div>
    </div>
  </Link>
));
StatCard.displayName = 'StatCard';

export const DashboardStatGrid = memo(function DashboardStatGrid() {
  const { isLoading, totalOrders, lifetimeSpend, activeCourses } = useDashboardSummary();
  const { wishlistIds } = useWishlist();
  const wishlistCount = wishlistIds.size;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] sm:h-[84px] rounded-xl bg-white/20" />
        ))}
      </div>
    );
  }

  const fmtSpend = lifetimeSpend >= 1000
    ? `৳${(lifetimeSpend / 1000).toFixed(1)}k`
    : `৳${lifetimeSpend.toFixed(0)}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard label="Total Orders" value={String(totalOrders)} icon={Package} to="/dashboard?tab=orders" />
      <StatCard label="Lifetime Spend" value={fmtSpend} icon={Wallet} to="/dashboard?tab=orders" />
      <StatCard label="Active Courses" value={String(activeCourses)} icon={GraduationCap} to="/dashboard?tab=courses" />
      <StatCard label="Wishlist" value={String(wishlistCount)} icon={Heart} to="/dashboard?tab=wishlist" />
    </div>
  );
});
