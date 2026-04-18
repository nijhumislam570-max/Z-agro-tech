import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Command, Loader2, PawPrint, Store, Stethoscope, Building2, Users, ShoppingCart, FileText, MessageCircle, CalendarDays, Package, LayoutDashboard, Settings, UserCircle, Bell, Heart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Command as CommandPrimitive, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useDebounce } from '@/hooks/useDebounce';

/** Escape special PostgREST filter characters to prevent injection */
const sanitizeSearchTerm = (term: string): string => {
  return term.replace(/[%_,.()"\\]/g, '');
};

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'pet' | 'product' | 'clinic' | 'order' | 'appointment' | 'user' | 'post' | 'page' | 'doctor' | 'service';
  icon: React.ReactNode;
  url: string;
}

interface GlobalSearchProps {
  className?: string;
  variant?: 'navbar' | 'admin' | 'clinic';
  placeholder?: string;
}

export const GlobalSearch = ({ className, variant = 'navbar', placeholder }: GlobalSearchProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin, isClinicOwner, isDoctor } = useUserRole();

  // Get placeholder based on role and context
  const getPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    
    if (variant === 'admin') {
      return 'Search orders, products, users...';
    }
    if (variant === 'clinic') {
      return 'Search appointments, doctors...';
    }
    if (isAdmin) {
      return 'Search everything...';
    }
    if (isClinicOwner) {
      return 'Search pets, clinics, products...';
    }
    return 'Search pets, products, clinics...';
  }, [variant, isAdmin, isClinicOwner, placeholder]);

  // Quick navigation items based on role
  const quickNavItems = useMemo(() => {
    const baseItems: SearchResult[] = [
      { id: 'nav-feed', title: 'Feed', subtitle: 'View social feed', type: 'page', icon: <Heart className="h-4 w-4" />, url: '/feed' },
      { id: 'nav-explore', title: 'Explore', subtitle: 'Discover pets', type: 'page', icon: <PawPrint className="h-4 w-4" />, url: '/explore' },
      { id: 'nav-shop', title: 'Shop', subtitle: 'Browse products', type: 'page', icon: <Store className="h-4 w-4" />, url: '/shop' },
      { id: 'nav-clinics', title: 'Clinics', subtitle: 'Find veterinary clinics', type: 'page', icon: <Stethoscope className="h-4 w-4" />, url: '/clinics' },
    ];

    if (user) {
      baseItems.push(
        { id: 'nav-messages', title: 'Messages', subtitle: 'View conversations', type: 'page', icon: <MessageCircle className="h-4 w-4" />, url: '/messages' },
        { id: 'nav-notifications', title: 'Notifications', subtitle: 'View alerts', type: 'page', icon: <Bell className="h-4 w-4" />, url: '/notifications' },
        { id: 'nav-profile', title: 'My Profile', subtitle: 'View your profile', type: 'page', icon: <UserCircle className="h-4 w-4" />, url: '/profile' }
      );
    }

    if (isAdmin) {
      baseItems.push(
        { id: 'nav-admin', title: 'Admin Dashboard', subtitle: 'Manage platform', type: 'page', icon: <LayoutDashboard className="h-4 w-4" />, url: '/admin' },
        { id: 'nav-admin-products', title: 'Manage Products', subtitle: 'Admin products', type: 'page', icon: <Package className="h-4 w-4" />, url: '/admin/products' },
        { id: 'nav-admin-orders', title: 'Manage Orders', subtitle: 'Admin orders', type: 'page', icon: <ShoppingCart className="h-4 w-4" />, url: '/admin/orders' },
        { id: 'nav-admin-customers', title: 'Manage Customers', subtitle: 'Admin users', type: 'page', icon: <Users className="h-4 w-4" />, url: '/admin/customers' },
        { id: 'nav-admin-clinics', title: 'Manage Clinics', subtitle: 'Admin clinics', type: 'page', icon: <Building2 className="h-4 w-4" />, url: '/admin/clinics' },
        { id: 'nav-admin-social', title: 'Manage Social', subtitle: 'Admin social media', type: 'page', icon: <FileText className="h-4 w-4" />, url: '/admin/social' },
        { id: 'nav-admin-analytics', title: 'Analytics', subtitle: 'View analytics', type: 'page', icon: <TrendingUp className="h-4 w-4" />, url: '/admin/analytics' }
      );
    }

    if (isClinicOwner) {
      baseItems.push(
        { id: 'nav-clinic-dashboard', title: 'Clinic Dashboard', subtitle: 'Manage your clinic', type: 'page', icon: <Building2 className="h-4 w-4" />, url: '/clinic/dashboard' },
        { id: 'nav-clinic-doctors', title: 'Manage Doctors', subtitle: 'Clinic doctors', type: 'page', icon: <Stethoscope className="h-4 w-4" />, url: '/clinic/doctors' },
        { id: 'nav-clinic-services', title: 'Manage Services', subtitle: 'Clinic services', type: 'page', icon: <Package className="h-4 w-4" />, url: '/clinic/services' },
        { id: 'nav-clinic-profile', title: 'Clinic Settings', subtitle: 'Edit clinic profile', type: 'page', icon: <Settings className="h-4 w-4" />, url: '/clinic/profile' }
      );
    }

    if (isDoctor) {
      baseItems.push(
        { id: 'nav-doctor-dashboard', title: 'Doctor Dashboard', subtitle: 'View appointments', type: 'page', icon: <Stethoscope className="h-4 w-4" />, url: '/doctor/dashboard' },
        { id: 'nav-doctor-profile', title: 'Doctor Profile', subtitle: 'Edit your profile', type: 'page', icon: <UserCircle className="h-4 w-4" />, url: '/doctor/profile' }
      );
    }

    return baseItems;
  }, [user, isAdmin, isClinicOwner, isDoctor]);

  // Debounce search query to prevent database flooding (SEC-2)
  const debouncedQuery = useDebounce(query, 300);

  // Search results from database
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery, variant],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      
      const results: SearchResult[] = [];
      const searchTerm = sanitizeSearchTerm(debouncedQuery.toLowerCase());
      
      // Reject if sanitized term is too short
      if (searchTerm.length < 2) return [];

      // Search pets
      const { data: pets } = await supabase
        .from('pets')
        .select('id, name, species, breed')
        .or(`name.ilike.%${searchTerm}%,species.ilike.%${searchTerm}%,breed.ilike.%${searchTerm}%`)
        .limit(5);

      if (pets) {
        results.push(...pets.map(pet => ({
          id: `pet-${pet.id}`,
          title: pet.name,
          subtitle: `${pet.species}${pet.breed ? ` • ${pet.breed}` : ''}`,
          type: 'pet' as const,
          icon: <PawPrint className="h-4 w-4" />,
          url: `/pet/${pet.id}`
        })));
      }

      // Search products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category, price')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .limit(5);

      if (products) {
        results.push(...products.map(product => ({
          id: `product-${product.id}`,
          title: product.name,
          subtitle: `${product.category} • ৳${product.price}`,
          type: 'product' as const,
          icon: <Store className="h-4 w-4" />,
          url: `/product/${product.id}`
        })));
      }

      // Search clinics (public view)
      const [clinicsRes, doctorsRes] = await Promise.all([
        supabase
          .from('clinics_public')
          .select('id, name, address')
          .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
          .limit(5),
        supabase
          .from('doctors_public')
          .select('id, name, specialization')
          .or(`name.ilike.%${searchTerm}%,specialization.ilike.%${searchTerm}%`)
          .limit(5),
      ]);

      if (clinicsRes.data) {
        results.push(...clinicsRes.data.map(clinic => ({
          id: `clinic-${clinic.id}`,
          title: clinic.name || 'Clinic',
          subtitle: clinic.address || 'No address',
          type: 'clinic' as const,
          icon: <Building2 className="h-4 w-4" />,
          url: `/clinic/${clinic.id}`
        })));
      }

      if (doctorsRes.data) {
        results.push(...doctorsRes.data.map(doctor => ({
          id: `doctor-${doctor.id}`,
          title: doctor.name || 'Doctor',
          subtitle: doctor.specialization || 'Veterinarian',
          type: 'doctor' as const,
          icon: <Stethoscope className="h-4 w-4" />,
          url: `/doctor/${doctor.id}`
        })));
      }

      // Admin-specific searches
      if (isAdmin && (variant === 'admin' || variant === 'navbar')) {
        // Search orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status, total_amount, shipping_address')
          .or(`id.ilike.%${searchTerm}%,shipping_address.ilike.%${searchTerm}%`)
          .limit(5);

        if (orders) {
          results.push(...orders.map(order => ({
            id: `order-${order.id}`,
            title: `Order #${order.id.slice(0, 8)}`,
            subtitle: `${order.status} • ৳${order.total_amount}`,
            type: 'order' as const,
            icon: <ShoppingCart className="h-4 w-4" />,
            url: `/admin/orders?search=${order.id}`
          })));
        }

        // Search users
        const { data: users } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, phone')
          .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
          .limit(5);

        if (users) {
          results.push(...users.map(u => ({
            id: `user-${u.id}`,
            title: u.full_name || 'User',
            subtitle: u.phone || 'No phone',
            type: 'user' as const,
            icon: <Users className="h-4 w-4" />,
            url: `/admin/customers?search=${u.full_name || ''}`
          })));
        }
      }

      // Clinic owner specific searches
      if ((isClinicOwner || variant === 'clinic') && user) {
        // Search appointments for clinic owner
        const { data: appointments } = await supabase
          .from('appointments')
          .select('id, pet_name, appointment_date, status')
          .or(`pet_name.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`)
          .limit(5);

        if (appointments) {
          results.push(...appointments.map(apt => ({
            id: `appointment-${apt.id}`,
            title: apt.pet_name || 'Appointment',
            subtitle: `${apt.appointment_date} • ${apt.status}`,
            type: 'appointment' as const,
            icon: <CalendarDays className="h-4 w-4" />,
            url: '/clinic/dashboard'
          })));
        }
      }

      return results;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Filter quick nav items by query
  const filteredQuickNav = useMemo(() => {
    if (!query) return quickNavItems.slice(0, 6);
    return quickNavItems.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
    );
  }, [quickNavItems, query]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [location.pathname]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((url: string) => {
    setOpen(false);
    setQuery('');
    navigate(url);
  }, [navigate]);

  // Simple input for triggering the command palette
  const renderTrigger = () => (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        "flex items-center gap-2 w-full h-9 sm:h-10 px-3 sm:px-4 rounded-full bg-secondary/50 border border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-muted-foreground",
        className
      )}
    >
      <Search className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-left truncate">{getPlaceholder}</span>
      <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );

  return (
    <>
      {renderTrigger()}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-[calc(100vw-32px)] sm:max-w-lg rounded-2xl">
          <VisuallyHidden>
            <DialogTitle>Search</DialogTitle>
          </VisuallyHidden>
          <CommandPrimitive className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={getPlaceholder}
                className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CommandList className="max-h-[60vh] sm:max-h-80 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoading && debouncedQuery.length >= 2 && (!searchResults || searchResults.length === 0) && filteredQuickNav.length === 0 && (
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  No results found for "{query}"
                </CommandEmpty>
              )}

              {filteredQuickNav.length > 0 && (
                <CommandGroup heading="Quick Navigation">
                  {filteredQuickNav.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.title}
                      onSelect={() => handleSelect(item.url)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchResults && searchResults.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Search Results">
                    {searchResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={result.title}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                      >
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          result.type === 'pet' && "bg-primary/10 text-primary",
                          result.type === 'product' && "bg-emerald-500/10 text-emerald-600",
                          result.type === 'clinic' && "bg-blue-500/10 text-blue-600",
                          result.type === 'order' && "bg-amber-500/10 text-amber-600",
                          result.type === 'user' && "bg-purple-500/10 text-purple-600",
                          result.type === 'appointment' && "bg-pink-500/10 text-pink-600",
                          result.type === 'doctor' && "bg-teal-500/10 text-teal-600"
                        )}>
                          {result.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{result.title}</span>
                          <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                        </div>
                        <span className="ml-auto text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {result.type}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Quick actions based on context */}
              {!query && user && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Quick Actions">
                    <CommandItem
                      value="add-pet"
                      onSelect={() => handleSelect('/pets/new')}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <PawPrint className="h-4 w-4" />
                      </div>
                      <span className="text-sm">Add New Pet</span>
                    </CommandItem>
                    <CommandItem
                      value="cart"
                      onSelect={() => handleSelect('/cart')}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <span className="text-sm">View Cart</span>
                    </CommandItem>
                    {isAdmin && (
                      <CommandItem
                        value="admin-settings"
                        onSelect={() => handleSelect('/admin/settings')}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Settings className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Admin Settings</span>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground bg-muted/50">
              <div className="flex items-center gap-2">
                <kbd className="inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-[10px]">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-[10px]">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-[10px]">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalSearch;
