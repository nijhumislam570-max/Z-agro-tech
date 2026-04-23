import { useCallback } from 'react';
import { Home, Store, ShoppingCart, GraduationCap, Shield, LogIn, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useUserRole } from '@/hooks/useUserRole';
import { prefetchRoute } from '@/lib/imageUtils';
import { prefetchPublicRoute } from '@/lib/publicPrefetch';
import { prefetchAdminRoute } from '@/lib/adminPrefetch';

const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { isAdmin } = useUserRole();
  const qc = useQueryClient();

  const prefetch = useCallback((path: string) => {
    prefetchRoute(path);
    if (path.startsWith('/admin')) prefetchAdminRoute(path, qc);
    else prefetchPublicRoute(path, qc);
  }, [qc]);

  const getProfileItem = () => {
    if (isAdmin) return { icon: Shield, label: 'Admin', path: '/admin' };
    if (user) return { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' };
    return { icon: LogIn, label: 'Sign In', path: '/auth' };
  };

  const profileItem = getProfileItem();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', badge: 0 },
    { icon: Store, label: 'Shop', path: '/shop', badge: 0 },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: totalItems },
    { icon: GraduationCap, label: 'Academy', path: '/academy', badge: 0 },
    { icon: profileItem.icon, label: profileItem.label, path: profileItem.path, badge: 0 },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14 sm:h-16 max-w-lg mx-auto">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <Link
              key={index}
              to={item.path}
              onTouchStart={() => prefetch(item.path)}
              onFocus={() => prefetch(item.path)}
              onMouseEnter={() => prefetch(item.path)}
              aria-label={item.badge > 0 ? `${item.label}, ${item.badge} unread` : item.label}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95 active:bg-primary/10 rounded-lg ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 sm:w-8 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
