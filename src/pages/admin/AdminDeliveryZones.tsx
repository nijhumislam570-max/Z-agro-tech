import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, AlertCircle, Plus, Pencil, Trash2, MapPin, Truck, Clock
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdmin } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
// Admin realtime is centralized in AdminShell — no per-page subscription needed.
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { getDivisions } from '@/lib/bangladeshRegions';

const BANGLADESH_DIVISIONS = getDivisions();

interface DeliveryZone {
  id: string;
  zone_name: string;
  charge: number;
  delivery_fee: number;
  estimated_days: string | null;
  is_active: boolean;
  divisions: string[];
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  zone_name: '',
  charge: 0,
  delivery_fee: 0,
  estimated_days: '3-5 days',
  is_active: true,
  divisions: [] as string[],
};

const AdminDeliveryZones = () => {
  useDocumentTitle('Delivery Zones - Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  void isAdmin;

  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Realtime subscription
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('delivery-zones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_zones' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, queryClient]);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['admin-delivery-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DeliveryZone[];
    },
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        zone_name: data.zone_name.trim(),
        charge: data.charge,
        delivery_fee: data.delivery_fee,
        estimated_days: data.estimated_days || '3-5 days',
        is_active: data.is_active,
        divisions: data.divisions,
      };
      if (editingZone) {
        const { error } = await supabase.from('delivery_zones').update(payload).eq('id', editingZone.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('delivery_zones').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
      toast.success(editingZone ? 'Zone updated' : 'Zone created');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save zone'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
      toast.success('Zone deleted');
    },
    onError: () => toast.error('Failed to delete zone'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('delivery_zones').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
    },
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingZone(null);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      zone_name: zone.zone_name,
      charge: zone.charge,
      delivery_fee: zone.delivery_fee,
      estimated_days: zone.estimated_days || '3-5 days',
      is_active: zone.is_active,
      divisions: zone.divisions || [],
    });
    setDialogOpen(true);
  };

  const toggleDivision = (div: string) => {
    setFormData(prev => ({
      ...prev,
      divisions: prev.divisions.includes(div)
        ? prev.divisions.filter(d => d !== div)
        : [...prev.divisions, div],
    }));
  };

  const handleSubmit = () => {
    if (!formData.zone_name.trim()) { toast.error('Zone name is required'); return; }
    if (formData.divisions.length === 0) { toast.error('Select at least one division'); return; }
    if (formData.charge < 0 || formData.delivery_fee < 0) { toast.error('Charge and delivery fee must be positive'); return; }
    saveMutation.mutate(formData);
  };


  const activeCount = zones.filter(z => z.is_active).length;

  return (
    <AdminLayout title="Delivery Zones" subtitle={`${zones.length} zones configured • ${activeCount} active`}>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{zones.length} total</Badge>
          <Badge variant="secondary" className="text-xs">{activeCount} active</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 min-h-[44px] sm:min-h-0">
              <Plus className="h-4 w-4" /> Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingZone ? 'Edit Zone' : 'Create Delivery Zone'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Zone Name</Label>
                <Input value={formData.zone_name} onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })} placeholder="e.g. Dhaka Inside" className="h-11" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Charge (৳)</Label>
                  <Input type="number" value={formData.charge} onChange={(e) => setFormData({ ...formData, charge: parseFloat(e.target.value) || 0 })} className="h-11" min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Delivery Fee (৳)</Label>
                  <Input type="number" value={formData.delivery_fee} onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) || 0 })} className="h-11" min={0} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Estimated Delivery</Label>
                <Input value={formData.estimated_days} onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })} placeholder="e.g. 3-5 days" className="h-11" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm">Divisions</Label>
                <div className="flex flex-wrap gap-2">
                  {BANGLADESH_DIVISIONS.map(div => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => toggleDivision(div)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.divisions.includes(div)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
                {formData.divisions.length > 0 && (
                  <p className="text-xs text-muted-foreground">{formData.divisions.length} division{formData.divisions.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <Label className="text-sm">Active</Label>
                <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingZone ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <TableSkeleton variant="cards" rows={4} />
      ) : zones.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No delivery zones"
          description="Create zones to set location-based delivery pricing."
          action={
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Create Zone
            </Button>
          }
        />
      ) : isMobile ? (
        /* Mobile card layout */
        <div className="grid gap-3">
          {zones.map(zone => (
            <Card key={zone.id} className={`transition-all ${!zone.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${zone.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{zone.zone_name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {zone.estimated_days}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={zone.is_active}
                    onCheckedChange={(c) => toggleMutation.mutate({ id: zone.id, active: c })}
                    className="scale-90"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Charge</p>
                    <p className="font-bold text-sm">৳{zone.charge}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Fee</p>
                    <p className="font-bold text-sm">৳{zone.delivery_fee}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {zone.divisions?.map(d => (
                    <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => openEdit(zone)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete this zone?')) deleteMutation.mutate(zone.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop table layout */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone Name</TableHead>
                  <TableHead>Divisions</TableHead>
                  <TableHead className="text-right">Charge (৳)</TableHead>
                  <TableHead className="text-right">Fee (৳)</TableHead>
                  <TableHead>Est. Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map(zone => (
                  <TableRow key={zone.id} className={`hover:bg-muted/40 transition-colors ${!zone.is_active ? 'opacity-60' : ''}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium">{zone.zone_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {zone.divisions?.map(d => (
                          <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">৳{zone.charge}</TableCell>
                    <TableCell className="text-right">৳{zone.delivery_fee}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {zone.estimated_days}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={zone.is_active}
                        onCheckedChange={(c) => toggleMutation.mutate({ id: zone.id, active: c })}
                        className="scale-90"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(zone)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm('Delete this zone?')) deleteMutation.mutate(zone.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default AdminDeliveryZones;
