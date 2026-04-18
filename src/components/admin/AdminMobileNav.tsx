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
  Building2,
  MessageCircleHeart,
  ChevronRight,
  Shield,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Stethoscope,
  Mail,
  Ticket,
  MapPin,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchRoute } from '@/lib/imageUtils';
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
    ]
  },
  {
    title: 'E-Commerce',
    icon: Package,
    items: [
      { icon: Package, label: 'Products', path: '/admin/products', description: 'Manage inventory' },
      { icon: Truck, label: 'Orders', path: '/admin/orders', description: 'Process orders' },
      { icon: ShoppingBag, label: 'Customers', path: '/admin/ecommerce-customers', description: 'Payments & buyers' },
      { icon: Ticket, label: 'Coupons', path: '/admin/coupons', description: 'Discount codes' },
      { icon: MapPin, label: 'Delivery Zones', path: '/admin/delivery-zones', description: 'Zone pricing' },
      { icon: AlertCircle, label: 'Incomplete Orders', path: '/admin/incomplete-orders', description: 'Abandoned checkouts' },
      { icon: BarChart4, label: 'Recovery Analytics', path: '/admin/recovery-analytics', description: 'Recovery insights' },
    ]
  },
  {
    title: 'Platform',
    icon: Building2,
    items: [
      { icon: Building2, label: 'Clinics', path: '/admin/clinics', description: 'Verify & manage' },
      { icon: Stethoscope, label: 'Doctors', path: '/admin/doctors', description: 'Verify doctors' },
      { icon: MessageCircleHeart, label: 'Social', path: '/admin/social', description: 'Posts & content' },
      { icon: FileText, label: 'Content Hub', path: '/admin/cms', description: 'Articles & blog' },
      { icon: ShieldCheck, label: 'User Management', path: '/admin/customers', description: 'Roles & permissions' },
      { icon: Mail, label: 'Messages', path: '/admin/messages', description: 'Contact submissions' },
    ]
  },
  {
    title: 'System',
    icon: Settings,
    items: [
      { icon: Settings, label: 'Settings', path: '/admin/settings', description: 'Configuration' },
    ]
  },
];

interface AdminMobileNavProps {
  pendingOrders?: number;
  pendingVerifications?: number;
  pendingDoctors?: number;
}

export const AdminMobileNav = ({ pendingOrders = 0, pendingVerifications = 0, pendingDoctors = 0 }: AdminMobileNavProps) => {
  const location = useLocation();
  const totalPending = pendingOrders + pendingVerifications + pendingDoctors;

  // Add badges dynamically
  const sectionsWithBadges = navSections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item.path === '/admin/orders' && pendingOrders > 0) {
        return { ...item, badge: pendingOrders, badgeVariant: 'destructive' as const };
      }
      if (item.path === '/admin/clinics' && pendingVerifications > 0) {
        return { ...item, badge: pendingVerifications, badgeVariant: 'default' as const };
      }
      if (item.path === '/admin/doctors' && pendingDoctors > 0) {
        return { ...item, badge: pendingDoctors, badgeVariant: 'default' as const };
      }
      return item;
    })
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
                VET-MEDIX
              </span>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
            </div>
          </Link>
        </SheetClose>

        {/* Quick Stats */}
        {totalPending > 0 && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                {totalPending} Pending Action{totalPending !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                {pendingOrders > 0 && `${pendingOrders} order${pendingOrders !== 1 ? 's' : ''}`}
                {pendingOrders > 0 && (pendingVerifications > 0 || pendingDoctors > 0) && ' • '}
                {pendingVerifications > 0 && `${pendingVerifications} clinic${pendingVerifications !== 1 ? 's' : ''}`}
                {pendingVerifications > 0 && pendingDoctors > 0 && ' • '}
                {pendingDoctors > 0 && `${pendingDoctors} doctor${pendingDoctors !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-5">
        {sectionsWithBadges.map((section) => (
          <div key={section.title}>
            {/* Section Header */}
            <div className="flex items-center gap-2 px-2 mb-2">
              {section.icon && (
                <section.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">
                {section.title}
              </span>
            </div>

            {/* Navigation Items */}
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));
                
                return (
                  <SheetClose asChild key={item.path}>
                    <Link
                      to={item.path}
                      onTouchStart={() => prefetchRoute(item.path)}
                      onMouseEnter={() => prefetchRoute(item.path)}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]",
                        isActive 
                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20" 
                          : "text-foreground bg-muted/30 hover:bg-muted/60 active:bg-muted"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0 transition-all duration-200",
                        isActive 
                          ? "bg-white/20" 
                          : "bg-gradient-to-br from-primary/10 to-accent/10"
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary-foreground" : "text-primary"
                        )} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          isActive ? "text-primary-foreground" : "text-foreground"
                        )}>
                          {item.label}
                        </p>
                        {item.description && (
                          <p className={cn(
                            "text-[11px] truncate",
                            isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Badge */}
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant={item.badgeVariant || 'default'} 
                          className={cn(
                            "h-6 min-w-6 px-2 text-[11px] font-bold",
                            isActive && "bg-white/20 text-white border-white/30"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}

                      {/* Chevron */}
                      <ChevronRight className={cn(
                        "h-4 w-4 flex-shrink-0 opacity-40",
                        isActive && "text-primary-foreground opacity-60"
                      )} />
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
