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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Users,
  Mail,
  Ticket,
  MapPin,
  AlertCircle,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchRoute } from '@/lib/imageUtils';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
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
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    ],
  },
  {
    title: 'E-Commerce',
    icon: Package,
    items: [
      { icon: Package, label: 'Products', path: '/admin/products' },
      { icon: Truck, label: 'Orders', path: '/admin/orders' },
      { icon: ShoppingBag, label: 'Customers', path: '/admin/ecommerce-customers' },
      { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
      { icon: MapPin, label: 'Delivery Zones', path: '/admin/delivery-zones' },
      { icon: AlertCircle, label: 'Incomplete Orders', path: '/admin/incomplete-orders' },
      { icon: BarChart4, label: 'Recovery Analytics', path: '/admin/recovery-analytics' },
    ],
  },
  {
    title: 'Academy',
    icon: GraduationCap,
    items: [
      { icon: GraduationCap, label: 'Courses', path: '/admin/courses' },
      { icon: Users, label: 'Enrollments', path: '/admin/enrollments' },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    items: [
      { icon: Users, label: 'User Management', path: '/admin/customers' },
      { icon: Mail, label: 'Messages', path: '/admin/messages' },
      { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  pendingOrders?: number;
  incompleteOrders?: number;
  unreadMessages?: number;
}

export const AdminSidebar = ({
  collapsed,
  onToggle,
  pendingOrders = 0,
  incompleteOrders = 0,
  unreadMessages = 0,
}: AdminSidebarProps) => {
  const location = useLocation();

  const sectionsWithBadges = navSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.path === '/admin/orders' && pendingOrders > 0) {
        return { ...item, badge: pendingOrders, badgeVariant: 'destructive' as const };
      }
      if (item.path === '/admin/incomplete-orders' && incompleteOrders > 0) {
        return { ...item, badge: incompleteOrders, badgeVariant: 'outline' as const };
      }
      if (item.path === '/admin/messages' && unreadMessages > 0) {
        return { ...item, badge: unreadMessages, badgeVariant: 'default' as const };
      }
      return item;
    }),
  }));

  const totalPending = pendingOrders + incompleteOrders + unreadMessages;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
          'bg-gradient-to-b from-background via-background to-muted/20',
          'border-r border-border/40 shadow-xl',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        <div
          className={cn(
            'relative p-4 border-b border-border/40',
            'bg-gradient-to-r from-primary/5 via-accent/5 to-transparent',
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />

          <Link to="/admin" className="relative flex items-center gap-3 group">
            {collapsed ? (
              <div className="relative mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Logo to="/admin" size="sm" showText={false} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Logo to="/admin" size="sm" showText={false} />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-base bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Z AGRO TECH
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Leaf className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                      Admin Panel
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Link>

          {!collapsed && totalPending > 0 && (
            <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                {totalPending} pending action{totalPending !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
          <div className="space-y-6">
            {sectionsWithBadges.map((section, sectionIdx) => (
              <div key={section.title}>
                {!collapsed && (
                  <div className="flex items-center gap-2 px-3 mb-2">
                    {section.icon && <section.icon className="h-3 w-3 text-muted-foreground/50" />}
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">
                      {section.title}
                    </span>
                  </div>
                )}

                {collapsed && sectionIdx > 0 && (
                  <div className="mx-auto w-8 h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/admin' && location.pathname.startsWith(item.path));

                    const navLink = (
                      <Link
                        key={item.path}
                        to={item.path}
                        onMouseEnter={() => prefetchRoute(item.path)}
                        className={cn(
                          'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                          collapsed ? 'px-3 py-2.5 justify-center mx-auto' : 'px-3 py-2.5',
                          isActive
                            ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          isActive &&
                            "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:rounded-full before:bg-primary-foreground/30",
                        )}
                      >
                        <item.icon
                          className={cn(
                            'flex-shrink-0 transition-transform duration-200',
                            collapsed ? 'h-5 w-5' : 'h-4 w-4',
                          )}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 whitespace-nowrap">{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <Badge
                                variant={item.badgeVariant || 'default'}
                                className={cn(
                                  'h-5 min-w-5 px-1.5 text-[10px] font-bold animate-pulse',
                                  isActive && 'bg-white/20 text-white border-white/30',
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                        {collapsed && item.badge && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shadow-lg animate-pulse">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.path}>
                          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="flex items-center gap-2 font-medium bg-popover/95 backdrop-blur-sm"
                          >
                            {item.label}
                            {item.badge && item.badge > 0 && (
                              <Badge variant={item.badgeVariant || 'default'} className="h-5 text-[10px]">
                                {item.badge}
                              </Badge>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return navLink;
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="mt-auto border-t border-border/40 bg-gradient-to-t from-muted/30 to-transparent">
          <div className={cn('p-2', collapsed && 'px-3')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn(
                'w-full flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-all duration-200',
                collapsed ? 'justify-center px-2 h-10' : 'justify-start px-3 h-9',
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </Button>
          </div>

          <div className={cn('p-3 pt-0', collapsed && 'p-2 pt-0')}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/"
                    className="flex items-center justify-center p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Back to Site
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                <span>Back to Site</span>
              </Link>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};
