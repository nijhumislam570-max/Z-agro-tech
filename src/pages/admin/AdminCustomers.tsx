import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Users,
  ShieldCheck,
  User,
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdmin, useAdminUsers } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { downloadCSV } from '@/lib/csvParser';
import { usePagination } from '@/hooks/usePagination';

type RoleFilter = 'all' | 'user' | 'admin';

const AdminCustomers = () => {
  useDocumentTitle('User Management - Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);
  const { user } = useAuth();
  const [adminUserPage, setAdminUserPage] = useState(0);
  const { data: customersData, isLoading } = useAdminUsers(adminUserPage);
  const customers = customersData?.users ?? [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Stats computed from data
  const stats = useMemo(() => {
    if (!customers) return { total: 0, admins: 0, users: 0 };
    const admins = customers.filter(c => c.user_roles?.some((r: any) => r.role === 'admin')).length;
    return { total: customers.length, admins, users: customers.length - admins };
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let result = customers || [];
    
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(c =>
        c.full_name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    }
    
    if (roleFilter !== 'all') {
      result = result.filter(c => {
        const roles = c.user_roles?.map((r: any) => r.role) || [];
        if (roleFilter === 'user') return roles.length === 0 || (roles.length === 1 && roles[0] === 'user');
        return roles.includes(roleFilter);
      });
    }
    
    return result;
  }, [customers, debouncedSearch, roleFilter]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    previousPage,
    nextPage,
    hasPreviousPage,
    hasNextPage,
    startIndex,
  } = usePagination({ data: filteredCustomers, pageSize: 20 });

  const handleStatClick = useCallback((role: RoleFilter) => {
    setRoleFilter(prev => prev === role ? 'all' : role);
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: 'admin' | 'user') => {
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }

      toast.success(`User role updated to ${role}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      toast.error(errorMessage);
    }
  }, [queryClient]);

  const getRoleBadge = (userRoles: any[] | null) => {
    const role = userRoles?.[0]?.role;
    switch (role) {
      case 'admin':
        return <Badge className="bg-accent/10 text-accent dark:bg-accent/15 dark:text-accent"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
      default:
        return <Badge variant="outline"><User className="h-3 w-3 mr-1" />User</Badge>;
    }
  };

  const handleExportCSV = useCallback(() => {
    if (!filteredCustomers.length) return;
    const headers = ['Name', 'Phone', 'Address', 'Division', 'District', 'Thana', 'Role', 'Joined'];
    const rows = filteredCustomers.map(customer => [
      customer.full_name || 'Unnamed',
      customer.phone || '',
      customer.address || '',
      customer.division || '',
      customer.district || '',
      customer.thana || '',
      customer.user_roles?.[0]?.role || 'user',
      format(new Date(customer.created_at), 'yyyy-MM-dd')
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    downloadCSV(csvContent, `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success('Customers exported to CSV');
  }, [filteredCustomers]);

  const handleDeleteUser = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: deleteTarget.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`User "${deleteTarget.name}" has been deleted`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, queryClient]);

  return (
    <AdminLayout title="User Management" subtitle="Manage platform users, roles & permissions">
      {/* Stats Bar — clickable to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[
          { key: 'all' as RoleFilter, label: 'Total Users', value: stats.total, icon: Users, iconColor: 'text-primary', iconBg: 'bg-primary/10', bgClass: 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10 dark:from-primary/10 dark:to-accent/10 dark:border-primary/20' },
          { key: 'user' as RoleFilter, label: 'Users', value: stats.users, icon: User, iconColor: 'text-success', iconBg: 'bg-success/10', bgClass: 'bg-gradient-to-br from-success-soft to-success-soft/50 border-success-border dark:from-success-soft/30 dark:to-success-soft/20 dark:border-success-border/50' },
          { key: 'admin' as RoleFilter, label: 'Admins', value: stats.admins, icon: ShieldCheck, iconColor: 'text-accent', iconBg: 'bg-accent/10', bgClass: 'bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 dark:from-accent/5 dark:to-accent/5 dark:border-accent/40' },
        ].map(({ key, label, value, icon: Icon, iconColor, iconBg, bgClass }) => {
          const isActive = roleFilter === key;
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => handleStatClick(key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStatClick(key); }}
              className={cn(
                'rounded-xl sm:rounded-2xl p-3 sm:p-4 border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]',
                bgClass,
                isActive && 'ring-2 ring-primary/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight mb-0.5 sm:mb-1">
                    {label}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{value}</p>
                </div>
                <div className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
                  <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Filter + Export */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-[140px] sm:w-[160px] h-10 sm:h-11 rounded-xl text-sm">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={!filteredCustomers.length}
            className="h-10 sm:h-11 rounded-xl text-sm gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
        Showing {paginatedData.length ? startIndex + 1 : 0}–{startIndex + paginatedData.length} of {filteredCustomers.length} customers
      </p>

      {/* Customers Table/Cards */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border">
              {paginatedData.map((customer) => (
                <div key={customer.user_id} className="p-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {customer.avatar_url && <AvatarImage src={customer.avatar_url} alt={customer.full_name || ''} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{customer.full_name || 'Unnamed'}</p>
                      {getRoleBadge(customer.user_roles)}
                    </div>
                    <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.district && customer.division ? `${customer.district}, ${customer.division}` : 'No location'}
                    </p>
                  </div>
                  {customer.user_id === user?.id ? (
                    <Badge variant="outline" className="text-xs flex-shrink-0">You</Badge>
                  ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'user')}>
                        <User className="h-4 w-4 mr-2" />Set as User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'admin')} className="text-accent">
                        <ShieldCheck className="h-4 w-4 mr-2" />Set as Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget({ id: customer.user_id, name: customer.full_name || 'Unnamed' })}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((customer) => (
                    <TableRow key={customer.user_id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {customer.avatar_url && <AvatarImage src={customer.avatar_url} alt={customer.full_name || ''} />}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.full_name || 'Unnamed'}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        {customer.district && customer.division ? `${customer.district}, ${customer.division}` : '-'}
                      </TableCell>
                      <TableCell>{getRoleBadge(customer.user_roles)}</TableCell>
                      <TableCell>{format(new Date(customer.created_at), 'PP')}</TableCell>
                      <TableCell>
                        {customer.user_id === user?.id ? (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'user')}>
                              <User className="h-4 w-4 mr-2" />Set as User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'admin')} className="text-accent">
                              <ShieldCheck className="h-4 w-4 mr-2" />Set as Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget({ id: customer.user_id, name: customer.full_name || 'Unnamed' })}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousPage} disabled={!hasPreviousPage} className="rounded-xl gap-1">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage} className="rounded-xl gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>? This will remove their account, profile, and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCustomers;
