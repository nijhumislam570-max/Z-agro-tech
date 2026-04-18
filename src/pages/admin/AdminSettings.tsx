import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { 
  Loader2,
  AlertCircle,
  Store,
  Bell,
  Shield,
  Save,
  Truck,
  Settings2,
  Globe,
  Phone,
  MapPin,
  DollarSign,
  Package,
  Clock,
  Users,
  Eye,
  MessageSquare,
  Mail,
  Upload,
  ImageIcon,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface StoreSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  taxRate: number;
  aboutText: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
  };
}

interface ShippingSettings {
  defaultCharge: number;
  freeShippingThreshold: number;
  enableFreeShipping: boolean;
  estimatedDeliveryDays: number;
  deliveryAreas: string;
  courierName: string;
}

interface OrderSettings {
  minOrderAmount: number;
  maxOrderAmount: number;
  autoCancelHours: number;
  enableCOD: boolean;
  enableOnlinePayment: boolean;
  lowStockThreshold: number;
  orderPrefix: string;
}

interface NotificationSettings {
  orderAlerts: boolean;
  lowStockAlerts: boolean;
  newCustomerAlerts: boolean;
  emailNotifications: boolean;
  appointmentAlerts: boolean;
  reviewAlerts: boolean;
}

interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  enableRegistration: boolean;
  enableSocialFeed: boolean;
  enableAppointments: boolean;
  enableShop: boolean;
  maxPetsPerUser: number;
  enableReviews: boolean;
}

const defaultStoreSettings: StoreSettings = {
  name: 'VET-MEDIX',
  email: 'vetmedix.25@gmail.com',
  phone: '',
  address: 'Gopalganj, Bangladesh',
  currency: 'BDT',
  taxRate: 0,
  aboutText: '',
  socialLinks: { facebook: '', instagram: '', youtube: '' },
};

const defaultShippingSettings: ShippingSettings = {
  defaultCharge: 100,
  freeShippingThreshold: 2000,
  enableFreeShipping: true,
  estimatedDeliveryDays: 3,
  deliveryAreas: 'All over Bangladesh',
  courierName: 'SteadFast',
};

const defaultOrderSettings: OrderSettings = {
  minOrderAmount: 100,
  maxOrderAmount: 50000,
  autoCancelHours: 48,
  enableCOD: true,
  enableOnlinePayment: false,
  lowStockThreshold: 5,
  orderPrefix: 'VM',
};

const defaultNotifications: NotificationSettings = {
  orderAlerts: true,
  lowStockAlerts: true,
  newCustomerAlerts: false,
  emailNotifications: true,
  appointmentAlerts: true,
  reviewAlerts: true,
};

const defaultPlatformSettings: PlatformSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
  enableRegistration: true,
  enableSocialFeed: true,
  enableAppointments: true,
  enableShop: true,
  maxPetsPerUser: 30,
  enableReviews: true,
};

const SettingRow = ({ icon: Icon, label, description, children }: {
  icon: React.ElementType;
  label: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm sm:text-base">{label}</p>
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const SaveButton = ({ isPending, onClick, label = 'Save Changes' }: { isPending: boolean; onClick: () => void; label?: string }) => (
  <Button onClick={onClick} disabled={isPending} className="w-full sm:w-auto min-h-[44px] sm:min-h-0 gap-2 text-sm">
    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
    {label}
  </Button>
);

interface BrandAssets {
  logo_url: string;
  favicon_url: string;
}

const defaultBrandAssets: BrandAssets = { logo_url: '', favicon_url: '' };

const AdminSettingsContent = () => {
  useDocumentTitle('Settings - Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShippingSettings);
  const [orderSettings, setOrderSettings] = useState<OrderSettings>(defaultOrderSettings);
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(defaultPlatformSettings);

  // Brand assets state
  const [brandAssets, setBrandAssets] = useState<BrandAssets>(defaultBrandAssets);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [savingBrand, setSavingBrand] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_settings').select('*');
      if (error) throw error;
      const get = (key: string) => data?.find(s => s.key === key)?.value;
      return {
        store: get('store') ? (get('store') as unknown as StoreSettings) : defaultStoreSettings,
        shipping: get('shipping') ? (get('shipping') as unknown as ShippingSettings) : defaultShippingSettings,
        orders: get('orders') ? (get('orders') as unknown as OrderSettings) : defaultOrderSettings,
        notifications: get('notifications') ? (get('notifications') as unknown as NotificationSettings) : defaultNotifications,
        platform: get('platform') ? (get('platform') as unknown as PlatformSettings) : defaultPlatformSettings,
        brand: get('brand_assets') ? (get('brand_assets') as unknown as BrandAssets) : defaultBrandAssets,
      };
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (settings) {
      setStoreSettings({ ...defaultStoreSettings, ...settings.store });
      setShippingSettings({ ...defaultShippingSettings, ...settings.shipping });
      setOrderSettings({ ...defaultOrderSettings, ...settings.orders });
      setNotifications({ ...defaultNotifications, ...settings.notifications });
      setPlatformSettings({ ...defaultPlatformSettings, ...settings.platform });
      const brand = { ...defaultBrandAssets, ...settings.brand };
      setBrandAssets(brand);
      if (brand.logo_url) setLogoPreview(brand.logo_url);
      if (brand.favicon_url) setFaviconPreview(brand.favicon_url);
    }
  }, [settings]);

  const buildSaveMutationConfig = (key: string, successMsg: string) => ({
    mutationFn: async (data: unknown) => {
      const { data: existing } = await supabase.from('admin_settings').select('id').eq('key', key).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('admin_settings')
          .update({ value: data as unknown as Json, updated_at: new Date().toISOString() })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('admin_settings')
          .insert({ key, value: data as unknown as Json });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success(successMsg);
    },
    onError: () => toast.error(`Failed to save ${key} settings`),
  });

  const saveStoreMutation = useMutation(buildSaveMutationConfig('store', 'Store settings saved'));
  const saveShippingMutation = useMutation(buildSaveMutationConfig('shipping', 'Shipping settings saved'));
  const saveOrderMutation = useMutation(buildSaveMutationConfig('orders', 'Order settings saved'));
  const saveNotificationsMutation = useMutation(buildSaveMutationConfig('notifications', 'Notification preferences saved'));
  const savePlatformMutation = useMutation(buildSaveMutationConfig('platform', 'Platform settings saved'));

  // Upload a file to site_assets bucket and return the public URL
  const uploadAsset = async (file: File, name: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${name}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('site_assets').upload(path, file, { upsert: true });
    if (upErr) throw upErr;
    const { data: { publicUrl } } = supabase.storage.from('site_assets').getPublicUrl(path);
    return publicUrl;
  };

  const handleSaveBrandAssets = async () => {
    setSavingBrand(true);
    try {
      const updated = { ...brandAssets };
      if (logoFile) updated.logo_url = await uploadAsset(logoFile, 'logo');
      if (faviconFile) updated.favicon_url = await uploadAsset(faviconFile, 'favicon');

      const { data: existing } = await supabase.from('admin_settings').select('id').eq('key', 'brand_assets').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('admin_settings').update({ value: updated as unknown as Json, updated_at: new Date().toISOString() }).eq('key', 'brand_assets');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('admin_settings').insert({ key: 'brand_assets', value: updated as unknown as Json });
        if (error) throw error;
      }

      setBrandAssets(updated);
      if (updated.logo_url) setLogoPreview(updated.logo_url);
      if (updated.favicon_url) setFaviconPreview(updated.favicon_url);
      setLogoFile(null);
      setFaviconFile(null);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Brand assets saved successfully!');
    } catch {
      toast.error('Failed to save brand assets. Please try again.');
    } finally {
      setSavingBrand(false);
    }
  };

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      if (faviconPreview && faviconPreview.startsWith('blob:')) URL.revokeObjectURL(faviconPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is 5 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      e.target.value = '';
      return;
    }

    if (type === 'logo') {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      if (faviconPreview && faviconPreview.startsWith('blob:')) URL.revokeObjectURL(faviconPreview);
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveAsset = useCallback((type: 'logo' | 'favicon') => {
    if (type === 'logo') {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      setLogoFile(null);
      setLogoPreview('');
      setBrandAssets(prev => ({ ...prev, logo_url: '' }));
      if (logoInputRef.current) logoInputRef.current.value = '';
    } else {
      if (faviconPreview && faviconPreview.startsWith('blob:')) URL.revokeObjectURL(faviconPreview);
      setFaviconFile(null);
      setFaviconPreview('');
      setBrandAssets(prev => ({ ...prev, favicon_url: '' }));
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  }, [logoPreview, faviconPreview]);


  return (
    <AdminLayout title="Settings" subtitle="Configure your platform settings">
      <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1 sm:w-auto sm:inline-flex">
          <TabsTrigger value="general" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Store className="h-3.5 w-3.5" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Truck className="h-3.5 w-3.5" />
            <span>Shipping</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5" />
            <span>Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Settings2 className="h-3.5 w-3.5" />
            <span>Platform</span>
          </TabsTrigger>
        </TabsList>

        {/* ── General Tab ── */}
        <TabsContent value="general">
          <div className="space-y-4 sm:space-y-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-base sm:text-lg">Store Information</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Basic information about your store</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="storeName" className="text-xs sm:text-sm">Store Name</Label>
                    <Input id="storeName" value={storeSettings.name} onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })} className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storeEmail" className="text-xs sm:text-sm">Contact Email</Label>
                    <Input id="storeEmail" type="email" value={storeSettings.email} onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })} className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storePhone" className="text-xs sm:text-sm">Phone Number</Label>
                    <Input id="storePhone" value={storeSettings.phone} onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })} placeholder="+880 XXXX XXXXXX" className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storeAddress" className="text-xs sm:text-sm">Address</Label>
                    <Input id="storeAddress" value={storeSettings.address} onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })} className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="text-xs sm:text-sm">Currency</Label>
                    <Select value={storeSettings.currency} onValueChange={(v) => setStoreSettings({ ...storeSettings, currency: v })}>
                      <SelectTrigger className="h-10 sm:h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BDT">BDT (৳)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="taxRate" className="text-xs sm:text-sm">Tax Rate (%)</Label>
                    <Input id="taxRate" type="number" value={storeSettings.taxRate} onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: parseFloat(e.target.value) || 0 })} className="h-10 sm:h-11" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">About / Footer Text</Label>
                  <Textarea value={storeSettings.aboutText} onChange={(e) => setStoreSettings({ ...storeSettings, aboutText: e.target.value })} placeholder="Short description for about section & footer" rows={3} />
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-sm mb-3">Social Links</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">Facebook</Label>
                      <Input value={storeSettings.socialLinks.facebook} onChange={(e) => setStoreSettings({ ...storeSettings, socialLinks: { ...storeSettings.socialLinks, facebook: e.target.value } })} placeholder="https://facebook.com/..." className="h-10 sm:h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">Instagram</Label>
                      <Input value={storeSettings.socialLinks.instagram} onChange={(e) => setStoreSettings({ ...storeSettings, socialLinks: { ...storeSettings.socialLinks, instagram: e.target.value } })} placeholder="https://instagram.com/..." className="h-10 sm:h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">YouTube</Label>
                      <Input value={storeSettings.socialLinks.youtube} onChange={(e) => setStoreSettings({ ...storeSettings, socialLinks: { ...storeSettings.socialLinks, youtube: e.target.value } })} placeholder="https://youtube.com/..." className="h-10 sm:h-11" />
                    </div>
                  </div>
                </div>

                <SaveButton isPending={saveStoreMutation.isPending} onClick={() => saveStoreMutation.mutate(storeSettings)} />
              </CardContent>
            </Card>

            {/* ── Brand Assets Card ── */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Brand Assets</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Upload your site logo and favicon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label htmlFor="logo-upload" className="text-xs sm:text-sm font-medium">
                      Site Logo
                      <span className="ml-1 text-muted-foreground font-normal">(PNG, JPG, SVG, WebP)</span>
                    </Label>
                    <div className="flex flex-col gap-3">
                      {logoPreview ? (
                        <div className="relative w-full h-28 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden p-2">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full"
                            onClick={() => handleRemoveAsset('logo')}
                            disabled={savingBrand}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full h-28 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1.5 text-muted-foreground bg-muted/20">
                          <ImageIcon className="h-7 w-7" />
                          <span className="text-xs">No logo uploaded</span>
                        </div>
                      )}
                      <input
                        id="logo-upload"
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        disabled={savingBrand}
                        onChange={(e) => handleFileChange(e, 'logo')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={savingBrand}
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full gap-2"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {logoFile ? logoFile.name.slice(0, 20) + (logoFile.name.length > 20 ? '…' : '') : 'Choose Logo'}
                      </Button>
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div className="space-y-3">
                    <Label htmlFor="favicon-upload" className="text-xs sm:text-sm font-medium">
                      Favicon
                      <span className="ml-1 text-muted-foreground font-normal">(PNG, ICO, SVG — 32×32 recommended)</span>
                    </Label>
                    <div className="flex flex-col gap-3">
                      {faviconPreview ? (
                        <div className="relative w-full h-28 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden p-2">
                          <img
                            src={faviconPreview}
                            alt="Favicon preview"
                            className="max-h-full max-w-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full"
                            onClick={() => handleRemoveAsset('favicon')}
                            disabled={savingBrand}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full h-28 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1.5 text-muted-foreground bg-muted/20">
                          <ImageIcon className="h-7 w-7" />
                          <span className="text-xs">No favicon uploaded</span>
                        </div>
                      )}
                      <input
                        id="favicon-upload"
                        ref={faviconInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                        className="hidden"
                        disabled={savingBrand}
                        onChange={(e) => handleFileChange(e, 'favicon')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={savingBrand}
                        onClick={() => faviconInputRef.current?.click()}
                        className="w-full gap-2"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {faviconFile ? faviconFile.name.slice(0, 20) + (faviconFile.name.length > 20 ? '…' : '') : 'Choose Favicon'}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    Max 5 MB per file. Files are stored securely and served publicly.
                  </p>
                  <Button
                    onClick={handleSaveBrandAssets}
                    disabled={savingBrand || (!logoFile && !faviconFile && brandAssets.logo_url === (settings?.brand?.logo_url ?? '') && brandAssets.favicon_url === (settings?.brand?.favicon_url ?? ''))}
                    className="gap-2 min-h-[44px] sm:min-h-0 flex-shrink-0"
                  >
                    {savingBrand ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Save Brand Assets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Shipping Tab ── */}
        <TabsContent value="shipping">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Shipping & Delivery</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure delivery charges and shipping options</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Default Delivery Charge (৳)</Label>
                  <Input type="number" value={shippingSettings.defaultCharge} onChange={(e) => setShippingSettings({ ...shippingSettings, defaultCharge: parseFloat(e.target.value) || 0 })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Estimated Delivery (Days)</Label>
                  <Input type="number" value={shippingSettings.estimatedDeliveryDays} onChange={(e) => setShippingSettings({ ...shippingSettings, estimatedDeliveryDays: parseInt(e.target.value) || 3 })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Courier Service</Label>
                  <Input value={shippingSettings.courierName} onChange={(e) => setShippingSettings({ ...shippingSettings, courierName: e.target.value })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Delivery Areas</Label>
                  <Input value={shippingSettings.deliveryAreas} onChange={(e) => setShippingSettings({ ...shippingSettings, deliveryAreas: e.target.value })} className="h-10 sm:h-11" />
                </div>
              </div>

              <Separator />

              <SettingRow icon={Truck} label="Free Shipping" description="Enable free shipping above a certain order amount">
                <Switch checked={shippingSettings.enableFreeShipping} onCheckedChange={(c) => setShippingSettings({ ...shippingSettings, enableFreeShipping: c })} />
              </SettingRow>

              {shippingSettings.enableFreeShipping && (
                <div className="space-y-1.5 pl-0 sm:pl-12">
                  <Label className="text-xs sm:text-sm">Free Shipping Threshold (৳)</Label>
                  <Input type="number" value={shippingSettings.freeShippingThreshold} onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: parseFloat(e.target.value) || 0 })} className="h-10 sm:h-11 max-w-xs" />
                  <p className="text-xs text-muted-foreground">Orders above this amount get free delivery</p>
                </div>
              )}

              <SaveButton isPending={saveShippingMutation.isPending} onClick={() => saveShippingMutation.mutate(shippingSettings)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Orders Tab ── */}
        <TabsContent value="orders">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Order Management</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure order processing rules and limits</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Order ID Prefix</Label>
                  <Input value={orderSettings.orderPrefix} onChange={(e) => setOrderSettings({ ...orderSettings, orderPrefix: e.target.value })} className="h-10 sm:h-11" placeholder="e.g. VM" />
                  <p className="text-xs text-muted-foreground">Prefix for order numbers (e.g. VM-001)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Auto-Cancel After (Hours)</Label>
                  <Input type="number" value={orderSettings.autoCancelHours} onChange={(e) => setOrderSettings({ ...orderSettings, autoCancelHours: parseInt(e.target.value) || 48 })} className="h-10 sm:h-11" />
                  <p className="text-xs text-muted-foreground">Pending orders auto-cancel after this time</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Minimum Order Amount (৳)</Label>
                  <Input type="number" value={orderSettings.minOrderAmount} onChange={(e) => setOrderSettings({ ...orderSettings, minOrderAmount: parseFloat(e.target.value) || 0 })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Maximum Order Amount (৳)</Label>
                  <Input type="number" value={orderSettings.maxOrderAmount} onChange={(e) => setOrderSettings({ ...orderSettings, maxOrderAmount: parseFloat(e.target.value) || 50000 })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Low Stock Alert Threshold</Label>
                  <Input type="number" value={orderSettings.lowStockThreshold} onChange={(e) => setOrderSettings({ ...orderSettings, lowStockThreshold: parseInt(e.target.value) || 5 })} className="h-10 sm:h-11" />
                  <p className="text-xs text-muted-foreground">Alert when stock falls below this number</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SettingRow icon={DollarSign} label="Cash on Delivery" description="Allow customers to pay on delivery">
                  <Switch checked={orderSettings.enableCOD} onCheckedChange={(c) => setOrderSettings({ ...orderSettings, enableCOD: c })} />
                </SettingRow>
                <SettingRow icon={Globe} label="Online Payment" description="Accept online payments (bKash, Nagad, etc.)">
                  <Switch checked={orderSettings.enableOnlinePayment} onCheckedChange={(c) => setOrderSettings({ ...orderSettings, enableOnlinePayment: c })} />
                </SettingRow>
              </div>

              <SaveButton isPending={saveOrderMutation.isPending} onClick={() => saveOrderMutation.mutate(orderSettings)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Notification Preferences</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-3 sm:space-y-4">
              <SettingRow icon={Package} label="New Order Alerts" description="Get notified when a new order is placed">
                <Switch checked={notifications.orderAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, orderAlerts: c })} />
              </SettingRow>
              <SettingRow icon={AlertCircle} label="Low Stock Alerts" description="Get notified when products are running low">
                <Switch checked={notifications.lowStockAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, lowStockAlerts: c })} />
              </SettingRow>
              <SettingRow icon={Users} label="New Customer Alerts" description="Get notified when a new customer registers">
                <Switch checked={notifications.newCustomerAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, newCustomerAlerts: c })} />
              </SettingRow>
              <SettingRow icon={Clock} label="Appointment Alerts" description="Get notified for new appointment bookings">
                <Switch checked={notifications.appointmentAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, appointmentAlerts: c })} />
              </SettingRow>
              <SettingRow icon={MessageSquare} label="Review Alerts" description="Get notified when customers leave reviews">
                <Switch checked={notifications.reviewAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, reviewAlerts: c })} />
              </SettingRow>
              <SettingRow icon={Mail} label="Email Notifications" description="Receive notifications via email">
                <Switch checked={notifications.emailNotifications} onCheckedChange={(c) => setNotifications({ ...notifications, emailNotifications: c })} />
              </SettingRow>

              <SaveButton isPending={saveNotificationsMutation.isPending} onClick={() => saveNotificationsMutation.mutate(notifications)} label="Save Preferences" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Platform Tab ── */}
        <TabsContent value="platform">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Platform Controls</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Enable or disable major features of the platform</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-3 sm:space-y-4">
              <SettingRow icon={Shield} label="Maintenance Mode" description="Temporarily disable public access to the site">
                <Switch checked={platformSettings.maintenanceMode} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, maintenanceMode: c })} />
              </SettingRow>

              {platformSettings.maintenanceMode && (
                <div className="space-y-1.5 pl-0 sm:pl-12">
                  <Label className="text-xs sm:text-sm">Maintenance Message</Label>
                  <Textarea value={platformSettings.maintenanceMessage} onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceMessage: e.target.value })} rows={2} />
                </div>
              )}

              <Separator />

              <SettingRow icon={Users} label="User Registration" description="Allow new users to sign up">
                <Switch checked={platformSettings.enableRegistration} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableRegistration: c })} />
              </SettingRow>
              <SettingRow icon={Store} label="E-Commerce / Shop" description="Enable the product shop and orders">
                <Switch checked={platformSettings.enableShop} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableShop: c })} />
              </SettingRow>
              <SettingRow icon={Clock} label="Appointments" description="Allow clinic appointment booking">
                <Switch checked={platformSettings.enableAppointments} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableAppointments: c })} />
              </SettingRow>
              <SettingRow icon={Eye} label="Social Feed" description="Enable the pet social media feed">
                <Switch checked={platformSettings.enableSocialFeed} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableSocialFeed: c })} />
              </SettingRow>
              <SettingRow icon={MessageSquare} label="Product Reviews" description="Allow customers to review products">
                <Switch checked={platformSettings.enableReviews} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableReviews: c })} />
              </SettingRow>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Max Pets Per User</Label>
                <Input type="number" value={platformSettings.maxPetsPerUser} onChange={(e) => setPlatformSettings({ ...platformSettings, maxPetsPerUser: parseInt(e.target.value) || 30 })} className="h-10 sm:h-11 max-w-xs" />
              </div>

              <SaveButton isPending={savePlatformMutation.isPending} onClick={() => savePlatformMutation.mutate(platformSettings)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

const AdminSettings = () => (
  <AdminSettingsContent />
);

export default AdminSettings;
