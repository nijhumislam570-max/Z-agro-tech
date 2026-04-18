import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Stethoscope, Package, Settings, Menu, User, 
  Home, LogOut, Bell, Search, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.jpeg';

interface ClinicHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

const clinicNavItems = [
  { path: '/clinic/dashboard', label: 'Dashboard', icon: Building2 },
  { path: '/clinic/doctors', label: 'Doctors', icon: Stethoscope },
  { path: '/clinic/services', label: 'Services', icon: Package },
  { path: '/clinic/profile', label: 'Settings', icon: Settings },
];

export const ClinicHeader = ({ title, showBackButton = false }: ClinicHeaderProps) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
          {/* Left - Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img 
                src={logo} 
                alt="VET-MEDIX Logo" 
                className="relative h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl object-contain bg-white shadow-md border-2 border-primary/20 group-hover:border-primary/50 group-hover:scale-105 transition-all duration-300"
                loading="eager"
                decoding="async"
                width={44}
                height={44}
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base sm:text-lg lg:text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                VET-MEDIX
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide hidden sm:block">
                Clinic Portal
              </p>
            </div>
          </Link>

          {/* Center - Nav tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            {clinicNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    active 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-muted-foreground hover:text-foreground relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            {/* Back to Site - Desktop */}
            <Button variant="ghost" size="sm" asChild className="hidden lg:flex gap-2 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <Home className="h-4 w-4" />
                Site
              </Link>
            </Button>

            {/* User Menu - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-3 cursor-pointer">
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center gap-3 cursor-pointer">
                    <Home className="h-4 w-4" />
                    Back to Site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate('/'); }} className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden">
                <SheetHeader className="p-4 pb-2 border-b border-border/50 flex-shrink-0">
                  <SheetTitle className="flex items-center gap-3">
                    <img 
                      src={logo} 
                      alt="VET-MEDIX" 
                      className="h-10 w-10 rounded-xl object-contain bg-white border-2 border-primary/20"
                      loading="eager"
                      decoding="async"
                      width={40}
                      height={40}
                    />
                    <div>
                      <span className="font-display font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        VET-MEDIX
                      </span>
                      <p className="text-xs text-muted-foreground font-normal">Clinic Portal</p>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Navigation */}
                <div className="flex flex-col p-4 gap-1 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Clinic Management</p>
                  
                  {clinicNavItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link 
                        key={item.path}
                        to={item.path} 
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] active:scale-[0.98] ${
                          active 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-foreground hover:bg-muted/50 active:bg-muted'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        {item.label}
                      </Link>
                    );
                  })}

                  <div className="h-px bg-border/50 my-3" />

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Account</p>

                  <Link 
                    to="/profile" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 active:bg-muted transition-all min-h-[44px] active:scale-[0.98]"
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    My Profile
                  </Link>

                  <Link 
                    to="/" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 active:bg-muted transition-all min-h-[44px] active:scale-[0.98]"
                  >
                    <Home className="h-5 w-5 text-muted-foreground" />
                    Back to Site
                  </Link>

                  <div className="h-px bg-border/50 my-3" />

                  <button
                    onClick={async () => { await signOut(); setIsMenuOpen(false); navigate('/'); }}
                    className="flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-all w-full text-left min-h-[44px] active:scale-[0.98]"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
