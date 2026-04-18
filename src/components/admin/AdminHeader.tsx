import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, User, LogOut, Home, PanelLeft, ShoppingCart, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminMobileNav } from './AdminMobileNav';
import logo from '@/assets/logo.jpeg';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  collapsed?: boolean;
  pendingOrders?: number;
  incompleteOrders?: number;
  unreadMessages?: number;
}

export const AdminHeader = ({
  title,
  subtitle,
  onToggleSidebar,
  collapsed,
  pendingOrders = 0,
  incompleteOrders = 0,
  unreadMessages = 0,
}: AdminHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const totalPending = pendingOrders + incompleteOrders + unreadMessages;

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast.success('Data refreshed');
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative md:hidden h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all duration-200 rounded-xl"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
                {totalPending > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse shadow-lg">
                    {totalPending > 9 ? '9+' : totalPending}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[88vw] max-w-[340px] h-[100dvh] max-h-[100dvh] overflow-hidden border-r-0 shadow-2xl">
              <AdminMobileNav
                pendingOrders={pendingOrders}
                incompleteOrders={incompleteOrders}
                unreadMessages={unreadMessages}
              />
            </SheetContent>
          </Sheet>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="hidden md:flex h-9 w-9 text-muted-foreground hover:text-foreground"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Link to="/admin" className="md:hidden flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src={logo}
                alt="Z Agro Tech Admin"
                className="relative h-9 w-9 rounded-xl object-contain bg-white shadow-md border-2 border-primary/20 group-hover:border-primary/50 transition-all"
                loading="eager"
                decoding="async"
                width={36}
                height={36}
              />
            </div>
            <span className="font-display font-bold text-sm sm:text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden xs:inline">Admin</span>
          </Link>

          <div className="hidden md:block">
            <h1 className="text-base lg:text-lg font-display font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>}
          </div>
        </div>

        <div className="md:hidden flex-1 text-center px-2">
          <h1 className="text-sm sm:text-base font-display font-bold text-foreground truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="hidden sm:flex h-9 w-9 text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                  aria-label="Refresh data"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                aria-label="Pending actions"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {totalPending > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:-top-0.5 sm:-right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {totalPending > 9 ? '9+' : totalPending}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-24px)] max-w-[320px] sm:w-80">
              <DropdownMenuLabel className="text-sm">Pending Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {pendingOrders > 0 && (
                <DropdownMenuItem onClick={() => navigate('/admin/orders?status=pending')} className="cursor-pointer py-3 px-3">
                  <ShoppingCart className="h-4 w-4 mr-3 text-warning flex-shrink-0" />
                  <span className="flex-1 text-sm">{pendingOrders} pending order{pendingOrders !== 1 ? 's' : ''}</span>
                  <Badge variant="outline" className="ml-2 bg-warning-light text-warning-foreground border-warning-border text-[10px]">
                    Action
                  </Badge>
                </DropdownMenuItem>
              )}
              {incompleteOrders > 0 && (
                <DropdownMenuItem onClick={() => navigate('/admin/incomplete-orders')} className="cursor-pointer py-3 px-3">
                  <AlertCircle className="h-4 w-4 mr-3 text-warning-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm">{incompleteOrders} abandoned cart{incompleteOrders !== 1 ? 's' : ''}</span>
                  <Badge variant="outline" className="ml-2 bg-warning-light text-warning-foreground border-warning-border text-[10px]">
                    Recover
                  </Badge>
                </DropdownMenuItem>
              )}
              {unreadMessages > 0 && (
                <DropdownMenuItem onClick={() => navigate('/admin/messages')} className="cursor-pointer py-3 px-3">
                  <Mail className="h-4 w-4 mr-3 text-info flex-shrink-0" />
                  <span className="flex-1 text-sm">{unreadMessages} unread message{unreadMessages !== 1 ? 's' : ''}</span>
                  <Badge variant="outline" className="ml-2 bg-info-light text-info border-info-border text-[10px] dark:bg-info-light/30 dark:text-info dark:border-info-border">
                    Reply
                  </Badge>
                </DropdownMenuItem>
              )}
              {totalPending === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>All caught up! No pending actions.</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="hidden 2xl:flex gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              <span>Site</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 active:scale-95 transition-transform" aria-label="Account menu">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-24px)] max-w-[240px] sm:w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm">Admin Account</span>
                  <span className="text-xs font-normal text-muted-foreground truncate max-w-[200px]">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="py-2.5">
                <Link to="/dashboard">
                  <User className="mr-2 h-4 w-4" />
                  My Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-2.5">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive py-2.5">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
