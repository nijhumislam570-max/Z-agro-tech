import { useState, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Store, Stethoscope, PawPrint, Compass, MessageCircle, Building2, Users, Shield, MessageCircleHeart, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useUserRole } from '@/hooks/useUserRole';
import { NotificationBell } from '@/components/social/NotificationBell';
import Logo from '@/components/Logo';
import { GlobalSearch } from '@/components/GlobalSearch';
import { prefetchRoute } from '@/lib/imageUtils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navLinks = [
  { path: '/feed', label: 'Feed', icon: MessageCircleHeart },
  { path: '/explore', label: 'Explore', icon: Compass },
  { path: '/shop', label: 'Shop', icon: Store },
  { path: '/clinics', label: 'Clinics', icon: Building2 },
  { path: '/doctors', label: 'Doctors', icon: Users },
  { path: '/blog', label: 'Blog', icon: FileText },
];

const Navbar = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const { isDoctor, isClinicOwner, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center h-14 sm:h-16 gap-2">
          {/* Logo - always visible, compact on small screens */}
          <Logo to="/" size="sm" showText showSubtitle={false} className="flex-shrink-0" />

          {/* Search Bar - Desktop only, between logo and nav */}
          <div className="hidden lg:flex flex-1 max-w-xs xl:max-w-sm mx-3 xl:mx-4 min-w-0">
            <GlobalSearch variant="navbar" className="w-full" />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-0.5 flex-shrink-0">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onMouseEnter={() => prefetchRoute(path)} onTouchStart={() => prefetchRoute(path)}>
                <Button
                  variant={isActive(path) ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-1.5 h-9 px-2 lg:px-3"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline text-xs">{label}</span>
                </Button>
              </Link>
            ))}

            {isClinicOwner && (
              <Link to="/clinic/dashboard">
                <Button variant={isActive('/clinic') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2 lg:px-3">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden xl:inline text-xs">My Clinic</span>
                </Button>
              </Link>
            )}
            {isDoctor && (
              <Link to="/doctor/dashboard">
                <Button variant={isActive('/doctor') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2 lg:px-3">
                  <Stethoscope className="h-4 w-4" />
                  <span className="hidden xl:inline text-xs">Doctor</span>
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={isActive('/admin') ? 'secondary' : 'outline'}
                  size="sm"
                  className="gap-1.5 h-9 px-2.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-xs">Admin</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1 md:flex-none" />

          {/* Right Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {user && (
              <Link to="/messages" className="hidden md:inline-flex">
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Messages">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <NotificationBell />

            {user ? (
              <div className="hidden md:flex items-center gap-0.5">
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Profile">
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
                <Button variant="default" size="sm" className="h-9 px-3 text-xs">Sign In</Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden">
                <SheetHeader className="p-4 pb-2 border-b border-border/50 flex-shrink-0">
                  <SheetTitle>
                    <Logo to="/" size="sm" showText showSubtitle className="justify-start" />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col p-4 gap-1 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  {/* Mobile Search */}
                  <div className="mb-3">
                    <GlobalSearch variant="navbar" className="w-full" />
                  </div>

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Navigate</p>

                  {navLinks.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] active:scale-[0.98] ${
                        isActive(path) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive(path) ? 'text-primary' : 'text-muted-foreground'}`} />
                      {label}
                    </Link>
                  ))}

                  <div className="h-px bg-border/50 my-2" />

                  {user ? (
                    <>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] active:scale-[0.98] ${isActive('/admin') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}>
                          <Shield className="h-5 w-5" />
                          Admin Panel
                        </Link>
                      )}
                      {isDoctor && (
                        <Link to="/doctor/dashboard" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] active:scale-[0.98] ${isActive('/doctor') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}>
                          <Stethoscope className="h-5 w-5" />
                          Doctor Dashboard
                        </Link>
                      )}
                      {isClinicOwner && (
                        <Link to="/clinic/dashboard" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] active:scale-[0.98] ${isActive('/clinic') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}>
                          <Building2 className="h-5 w-5" />
                          Clinic Dashboard
                        </Link>
                      )}
                      <Link to="/pets/new" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-all min-h-[44px] active:scale-[0.98]">
                        <PawPrint className="h-5 w-5 text-muted-foreground" />
                        Add Pet
                      </Link>
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-all min-h-[44px] active:scale-[0.98]">
                        <User className="h-5 w-5 text-muted-foreground" />
                        Profile
                      </Link>

                      <div className="h-px bg-border/50 my-2" />

                      <button
                        onClick={() => { signOut(); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full text-left min-h-[44px] active:scale-[0.98]"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="px-3 py-3 text-sm font-medium text-primary hover:bg-muted rounded-xl transition-all min-h-[44px] flex items-center active:scale-[0.98]">
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
