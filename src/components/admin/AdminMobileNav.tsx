import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingBag,
  Settings,
  ArrowLeft,
  BarChart3,
  BarChart4,
  ChevronRight,
  Sparkles,
  Leaf,
  AlertCircle,
  Mail,
  Ticket,
  MapPin,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { prefetchAdminRoute } from '@/lib/adminPrefetch';
import Logo from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { SheetClose } from '@/components/ui/sheet';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  description?: string;
  badge?: number;
  badgeVariant?: 'default' | 'destructive' | 'outline';
}

interface NavSection {
  title: string;
  icon?: React.ElementType;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    icon: Sparkles,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', description: 'Overview & stats' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', description: 'Reports & insights' },
    ],
  },
  {
    title: 'E-Commerce',
    icon: Package,
    items: [
      { icon: Package, label: 'Products', path: '/admin/products', description: 'Manage inventory' },
      { icon: Truck, label: 'Orders', path: '/admin/orders', description: 'Process orders' },
      { icon: ShoppingBag, label: 'Customers', path: '/admin/ecommerce-customers', description: 'Buyers & payments' },
      { icon: Ticket, label: 'Coupons', path: '/admin/coupons', description: 'Discount codes' },
      { icon: MapPin, label: 'Delivery Zones', path: '/admin/delivery-zones', description: 'Zone pricing' },
      { icon: AlertCircle, label: 'Incomplete Orders', path: '/admin/incomplete-orders', description: 'Abandoned carts' },
      { icon: BarChart4, label: 'Recovery Analytics', path: '/admin/recovery-analytics', description: 'Recovery insights' },
    ],
  },
  {
    title: 'Academy',
    icon: GraduationCap,
    items: [
      { icon: GraduationCap, label: 'Courses', path: '/admin/courses', description: 'Manage courses' },
      { icon: Users, label: 'Enrollments', path: '/admin/enrollments', description: 'Student enrollments' },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    items: [
      { icon: Users, label: 'User Management', path: '/admin/customers', description: 'Roles & permissions' },
      { icon: Mail, label: 'Messages', path: '/admin/messages', description: 'Contact submissions' },
      { icon: Settings, label: 'Settings', path: '/admin/settings', description: 'Configuration' },
    ],
  },
];

interface AdminMobileNavProps {
  pendingOrders?: number;
}

export const AdminMobileNav = ({
  pendingOrders = 0,
}: AdminMobileNavProps) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const prefetch = (path: string) => prefetchAdminRoute(path, queryClient);
  const totalPending = pendingOrders;

  const sectionsWithBadges = navSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.path === '/admin/orders' && pendingOrders > 0) {
        return { ...item, badge: pendingOrders, badgeVariant: 'destructive' as const };
      }
      return item;
    }),
  }));

  return (
    <div className="flex h-full max-h-[100dvh] flex-col bg-gradient-to-b from-background via-background to-muted/30 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 sm:p-5 border-b border-border/40 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent backdrop-blur-sm">
        <SheetClose asChild>
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Logo to="/admin" size="md" showText={false} />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Z AGRO TECH
              </span>
              <div className="flex items-center gap-1.5">
                <Leaf className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
            </div>
          </Link>
        </SheetClose>

        {totalPending > 0 && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-warning/10 to-warning/10 border border-warning/30">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-warning/20">
              <AlertCircle className="h-4 w-4 text-warning-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-warning-foreground">
                {totalPending} Pending Order{totalPending !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-warning-foreground/80 dark:text-warning/80">
                Awaiting your action
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-5">
        {sectionsWithBadges.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 px-2 mb-2">
              {section.icon && <section.icon className="h-3.5 w-3.5 text-muted-foreground/50" />}
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">
                {section.title}
              </span>
            </div>

            <div className="space-y-1.5">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));

                return (
                  <SheetClose asChild key={item.path}>
                    <Link
                      to={item.path}
                      onTouchStart={() => prefetch(item.path)}
                      onMouseEnter={() => prefetch(item.path)}
                      onFocus={() => prefetch(item.path)}
                      className={cn(
                        'relative flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]',
                        isActive
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
                          : 'text-foreground bg-muted/30 hover:bg-muted/60 active:bg-muted',
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0 transition-all duration-200',
                          isActive ? 'bg-white/20' : 'bg-gradient-to-br from-primary/10 to-accent/10',
                        )}
                      >
                        <item.icon
                          className={cn('h-5 w-5', isActive ? 'text-primary-foreground' : 'text-primary')}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-semibold truncate',
                            isActive ? 'text-primary-foreground' : 'text-foreground',
                          )}
                        >
                          {item.label}
                        </p>
                        {item.description && (
                          <p
                            className={cn(
                              'text-[11px] truncate',
                              isActive ? 'text-primary-foreground/70' : 'text-muted-foreground',
                            )}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      {item.badge && item.badge > 0 && (
                        <Badge
                          variant={item.badgeVariant || 'default'}
                          className={cn(
                            'h-6 min-w-6 px-2 text-[11px] font-bold',
                            isActive && 'bg-white/20 text-white border-white/30',
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}

                      <ChevronRight
                        className={cn(
                          'h-4 w-4 flex-shrink-0 opacity-40',
                          isActive && 'text-primary-foreground opacity-60',
                        )}
                      />
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] border-t border-border/40 bg-gradient-to-t from-muted/50 to-transparent backdrop-blur-sm">
        <SheetClose asChild>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-muted-foreground bg-muted/40 hover:bg-muted/70 hover:text-foreground transition-all duration-200 active:scale-[0.98] group"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted-foreground/10 group-hover:bg-muted-foreground/20 transition-colors">
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </div>
            <span className="flex-1">Back to Site</span>
            <ChevronRight className="h-4 w-4 opacity-40" />
          </Link>
        </SheetClose>
      </div>
    </div>
  );
};
