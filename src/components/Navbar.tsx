import { useState, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, User, Menu, LogOut, Store, GraduationCap, LayoutDashboard, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useUserRole } from '@/hooks/useUserRole';
import Logo from '@/components/Logo';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';

const navLinks = [
  { path: '/shop', label: 'Shop', icon: Store },
  { path: '/academy', label: 'Academy', icon: GraduationCap },
];

const Navbar = memo(() => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="sticky top-0 z-50 bg-card/85 backdrop-blur-xl border-b border-border/60">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center h-16 gap-3">
          <Logo to="/" size="sm" showText showSubtitle={false} className="flex-shrink-0" />

          <div className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 h-9 px-3"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </Button>
              </Link>
            ))}
            {user && (
              <Link to="/dashboard">
                <Button
                  variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 h-9 px-3"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="text-sm">Dashboard</span>
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={isActive('/admin') ? 'secondary' : 'outline'}
                  size="sm"
                  className="gap-2 h-9 px-3 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Admin</span>
                </Button>
              </Link>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <Link to="/cart" aria-label="Cart">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-accent text-accent-foreground">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-1">
                <Link to="/dashboard">
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Account">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Sign out"
                  onClick={() => { signOut(); navigate('/'); }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth" className="hidden md:inline-flex">
                <Button size="sm" className="h-9 px-4">Sign In</Button>
              </Link>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b border-border/50">
                  <SheetTitle>
                    <Logo to="/" size="sm" showText showSubtitle className="justify-start" />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col p-4 gap-1 overflow-y-auto">
                  {navLinks.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                        isActive(path) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  ))}
                  {user && (
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                        isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 min-h-[44px]"
                    >
                      <Shield className="h-5 w-5" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="h-px bg-border/50 my-2" />
                  {user ? (
                    <button
                      onClick={() => { signOut(); setOpen(false); navigate('/'); }}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left min-h-[44px]"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground min-h-[44px]"
                    >
                      <User className="h-5 w-5" />
                      Sign In
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';
export default Navbar;
