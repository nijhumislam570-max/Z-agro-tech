import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Package,
  FileSpreadsheet,
  Download,
  FileText,
  AlertTriangle,
  PackageMinus,
  PackagePlus,
  Tag,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdmin, useAdminProducts } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CSVImportDialog } from '@/components/admin/CSVImportDialog';
import { PDFImportDialog } from '@/components/admin/PDFImportDialog';
import { ProductStatsBar } from '@/components/admin/ProductStatsBar';
import { ProductsStatsSkeleton, ProductsTableSkeleton } from '@/components/admin/ProductsSkeleton';
import { ProductFormFields, type ProductFormData } from '@/components/admin/ProductFormFields';
import { productFormSchema } from '@/lib/validations';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { downloadCSV } from '@/lib/csvParser';
import { useProductCategories } from '@/hooks/useProductCategories';
import { cn } from '@/lib/utils';


type AdminProduct = NonNullable<ReturnType<typeof useAdminProducts>['data']>[number];

const LOW_STOCK_THRESHOLD = 10;

const emptyFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  compare_price: '',
  category: '',
  product_type: '',
  image_url: '',
  stock: '',
  sku: '',
  badge: '',
  discount: '',
  is_active: true,
  is_featured: false,
};

const AdminProducts = () => {
  useDocumentTitle('Products - Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);
  const { data: products, isLoading } = useAdminProducts();
  const { categories, addCategory, updateCategory, deleteCategory } = useProductCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [stockFilter, setStockFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPDFImportOpen, setIsPDFImportOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [quickStockEdit, setQuickStockEdit] = useState<{ id: string; stock: string } | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);


  const stats = useMemo(() => {
    if (!products) return { total: 0, inStock: 0, outOfStock: 0, lowStock: 0, featured: 0 };
    return {
      total: products.length,
      inStock: products.filter(p => (p.stock ?? 0) > 0).length,
      outOfStock: products.filter(p => (p.stock ?? 0) === 0).length,
      lowStock: products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length,
      featured: products.filter(p => p.is_featured).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products || [];
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.product_type?.toLowerCase().includes(q)
      );
    }
    if (stockFilter === 'low') {
      list = list.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5);
    } else if (stockFilter === 'out') {
      list = list.filter(p => (p.stock ?? 0) === 0);
    } else if (stockFilter === 'featured') {
      list = list.filter(p => p.is_featured);
    } else if (stockFilter === 'inactive') {
      list = list.filter(p => !p.is_active);
    }
    return list;
  }, [products, debouncedSearch, stockFilter]);

  const resetForm = useCallback(() => setFormData(emptyFormData), []);

  const validateAndParse = () => {
    return productFormSchema.safeParse({
      name: formData.name,
      description: formData.description || null,
      price: formData.price ? parseFloat(formData.price) : 0,
      category: formData.category,
      product_type: formData.product_type || null,
      image_url: formData.image_url || null,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      badge: formData.badge || null,
      discount: formData.discount ? parseFloat(formData.discount) : null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
      sku: formData.sku || null,
    });
  };

  const handleAdd = async () => {
    const result = validateAndParse();
    if (!result.success) {
      toast.error(result.error.errors.map(e => e.message).join(', '));
      return;
    }
    setSaving(true);
    try {
      const stock = result.data.stock;
      let badge = result.data.badge || null;
      if (stock > 0 && badge?.toLowerCase() === 'stock out') badge = null;
      if (stock === 0) badge = 'Stock Out';
      const { error } = await supabase.from('products').insert({
        name: result.data.name,
        description: result.data.description || null,
        price: result.data.price,
        category: result.data.category,
        product_type: result.data.product_type || null,
        image_url: result.data.image_url || null,
        stock,
        badge,
        discount: result.data.discount,
        is_active: result.data.is_active,
        is_featured: result.data.is_featured,
        compare_price: result.data.compare_price,
        sku: result.data.sku || null,
      });
      if (error) throw error;
      toast.success('Product added successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsAddOpen(false);
      resetForm();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    const result = validateAndParse();
    if (!result.success) {
      toast.error(result.error.errors.map(e => e.message).join(', '));
      return;
    }
    setSaving(true);
    try {
      const stock = result.data.stock;
      let badge = result.data.badge || null;
      if (stock > 0 && badge?.toLowerCase() === 'stock out') badge = null;
      if (stock === 0) badge = 'Stock Out';
      const { error } = await supabase.from('products').update({
        name: result.data.name,
        description: result.data.description || null,
        price: result.data.price,
        category: result.data.category,
        product_type: result.data.product_type || null,
        image_url: result.data.image_url || null,
        stock,
        badge,
        discount: result.data.discount,
        is_active: result.data.is_active,
        is_featured: result.data.is_featured,
        compare_price: result.data.compare_price,
        sku: result.data.sku || null,
      }).eq('id', selectedProduct.id);
      if (error) throw error;
      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsEditOpen(false);
      setSelectedProduct(null);
      resetForm();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', selectedProduct.id);
      if (error) throw error;
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStockUpdate = async (productId: string, newStock: number) => {
    try {
      // Auto-sync badge with stock status
      const product = products?.find(p => p.id === productId);
      const currentBadge = product?.badge;
      const updateData: any = { stock: newStock };
      if (newStock > 0 && currentBadge?.toLowerCase() === 'stock out') {
        updateData.badge = null;
      } else if (newStock === 0) {
        updateData.badge = 'Stock Out';
      }
      const { error } = await supabase.from('products').update(updateData).eq('id', productId);
      if (error) throw error;
      toast.success(`Stock set to ${newStock}`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setQuickStockEdit(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stock');
    }
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', productId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isActive ? 'Product activated' : 'Product deactivated');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed');
    }
  };

  const handleToggleFeatured = async (productId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_featured: isFeatured }).eq('id', productId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isFeatured ? 'Marked as featured' : 'Removed from featured');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed');
    }
  };

  const openEditDialog = (product: typeof filteredProducts[number]) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      compare_price: product.compare_price?.toString() || '',
      category: product.category,
      product_type: product.product_type || '',
      image_url: product.image_url || '',
      stock: (product.stock ?? 0).toString(),
      sku: product.sku || '',
      badge: product.badge || '',
      discount: product.discount?.toString() || '',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
    });
    setIsEditOpen(true);
  };

  const handleExportCSV = () => {
    if (!filteredProducts.length) return;
    const headers = ['Name', 'Description', 'Price', 'Compare Price', 'Category', 'Product Type', 'Stock', 'SKU', 'Badge', 'Discount', 'Active', 'Featured', 'Created'];
    const rows = filteredProducts.map(product => [
      product.name,
      product.description || '',
      product.price,
      product.compare_price || '',
      product.category,
      product.product_type || '',
      product.stock,
      product.sku || '',
      product.badge || '',
      product.discount || '',
      product.is_active ?? true,
      product.is_featured ?? false,
      product.created_at ? new Date(product.created_at).toISOString().split('T')[0] : ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadCSV(csvContent, `products-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Products exported to CSV');
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await addCategory.mutateAsync({ name: newCategoryName.trim(), slug });
    setNewCategoryName('');
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive" className="text-[10px] sm:text-xs">Out of Stock</Badge>;
    if (stock <= LOW_STOCK_THRESHOLD) return <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-[10px] sm:text-xs">Low: {stock}</Badge>;
    return <Badge className="bg-success/15 text-success border-success/30 text-[10px] sm:text-xs">In Stock</Badge>;
  };

  return (
    <AdminLayout title="Products" subtitle="Manage your product catalog">
      {/* Low Stock Alert Banner */}
      {!isLoading && (stats.outOfStock > 0 || stats.lowStock > 0) && (
        <div className="mb-4 p-3 sm:p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {stats.outOfStock > 0 && `${stats.outOfStock} out of stock`}
              {stats.outOfStock > 0 && stats.lowStock > 0 && ' · '}
              {stats.lowStock > 0 && `${stats.lowStock} low stock`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.outOfStock + stats.lowStock} product{(stats.outOfStock + stats.lowStock) !== 1 ? 's' : ''} need attention
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs flex-shrink-0 h-8"
            onClick={() => setStockFilter(stats.outOfStock > 0 ? 'out-of-stock' : 'low-stock')}>View</Button>
        </div>
      )}

      {/* Stats Bar */}
      {isLoading ? <ProductsStatsSkeleton /> : (
        <ProductStatsBar stats={stats} activeFilter={stockFilter} onFilterChange={setStockFilter} />
      )}

      {/* Header Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 justify-between mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products, type, category..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-11 rounded-xl text-base sm:text-sm" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 min-h-[44px] rounded-xl text-sm flex-shrink-0" onClick={() => setIsCategoryOpen(true)}>
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Categories</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 min-h-[44px] rounded-xl text-sm flex-shrink-0">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Import/Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
              <DropdownMenuItem onClick={handleExportCSV} disabled={!filteredProducts.length} className="min-h-[44px]">
                <Download className="h-4 w-4 mr-2" />Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportOpen(true)} className="min-h-[44px]">
                <FileSpreadsheet className="h-4 w-4 mr-2" />Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsPDFImportOpen(true)} className="min-h-[44px]">
                <FileText className="h-4 w-4 mr-2" />Import PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="h-11 min-h-[44px] rounded-xl text-sm flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-1" /><span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Products - Mobile Cards / Desktop Table */}
      {isLoading ? <ProductsTableSkeleton /> : (
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? 'No products match your search' : stockFilter !== 'all' ? 'No products match this filter' : 'No products found'}
              </p>
              {(searchQuery || stockFilter !== 'all') && (
                <Button variant="link" className="mt-2" onClick={() => { setSearchQuery(''); setStockFilter('all'); }}>Clear all filters</Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
               <div className="sm:hidden divide-y divide-border">
                {filteredProducts.map((product) => {
                  const stock = product.stock ?? 0;
                  const isLow = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                  const isOut = stock === 0;
                  const pActive = product.is_active ?? true;
                  const pFeatured = product.is_featured ?? false;
                  const comparePrice = product.compare_price;
                  const isQuickEditing = quickStockEdit?.id === product.id;

                  return (
                    <div key={product.id}
                      className={cn('p-3 transition-colors',
                        isOut && 'bg-destructive/5', isLow && 'bg-warning/5', !pActive && 'opacity-60'
                      )}>
                      {/* Top row: Image + Info */}
                      <div className="flex gap-3" onClick={() => !isQuickEditing && openEditDialog(product)}>
                        <div className="h-16 w-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0 relative">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                          )}
                          {isOut && (
                            <div className="absolute inset-0 bg-destructive/30 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="text-[9px] font-bold text-destructive-foreground bg-destructive/80 px-1.5 py-0.5 rounded">OUT</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate leading-tight">{product.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.product_type || product.category}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] flex-shrink-0 h-5 px-1.5">{product.category}</Badge>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-primary text-sm">৳{product.price}</span>
                              {comparePrice && comparePrice > product.price && (
                                <span className="text-xs text-muted-foreground line-through">৳{comparePrice}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {pFeatured && <Star className="h-3 w-3 text-warning fill-warning flex-shrink-0" />}
                              {!pActive && <Badge variant="outline" className="text-[9px] h-4 px-1 border-destructive/30 text-destructive">Off</Badge>}
                              {getStockBadge(stock)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons row */}
                      {isQuickEditing ? (
                        <div className="flex items-center gap-2 mt-2.5 pl-[76px]" onClick={(e) => e.stopPropagation()}>
                          <Input type="number" value={quickStockEdit.stock}
                            onChange={(e) => setQuickStockEdit({ ...quickStockEdit, stock: e.target.value })}
                            className="h-9 rounded-xl text-base w-20" autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickStockUpdate(product.id, parseInt(quickStockEdit.stock) || 0);
                              else if (e.key === 'Escape') setQuickStockEdit(null);
                            }} />
                          <Button size="sm" className="h-9 rounded-xl text-xs px-3 min-h-[44px]"
                            onClick={() => handleQuickStockUpdate(product.id, parseInt(quickStockEdit.stock) || 0)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-9 rounded-xl text-xs px-2 min-h-[44px]"
                            onClick={() => setQuickStockEdit(null)}>✕</Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                          <Button variant="outline" size="sm" className="h-9 min-h-[44px] rounded-xl text-xs"
                            onClick={(e) => { e.stopPropagation(); openEditDialog(product); }}>
                            <Edit2 className="h-3.5 w-3.5 mr-1" />Edit
                          </Button>
                          <Button variant={pFeatured ? "default" : "outline"} size="sm" className="h-9 min-h-[44px] rounded-xl text-xs"
                            onClick={(e) => { e.stopPropagation(); handleToggleFeatured(product.id, !pFeatured); }}>
                            <Star className={`h-3.5 w-3.5 mr-1 ${pFeatured ? 'fill-current' : ''}`} />
                            <span className="truncate">{pFeatured ? 'Yes' : 'Star'}</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-9 min-h-[44px] rounded-xl text-xs"
                            onClick={(e) => { e.stopPropagation(); setQuickStockEdit({ id: product.id, stock: stock.toString() }); }}>
                            <PackagePlus className="h-3.5 w-3.5 mr-1" />Stock
                          </Button>
                          <Button variant="outline" size="sm" className="h-9 min-h-[44px] rounded-xl text-xs text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setIsDeleteOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stock = product.stock ?? 0;
                      const isOut = stock === 0;
                      const isLow = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                      const pActive = product.is_active ?? true;
                      const pFeatured = product.is_featured ?? false;
                      const comparePrice = product.compare_price;

                      return (
                        <TableRow key={product.id}
                          className={cn('cursor-pointer transition-colors',
                            isOut && 'bg-destructive/5 hover:bg-destructive/10',
                            isLow && 'bg-warning/5 hover:bg-warning/10',
                            !pActive && 'opacity-60'
                          )}
                          onClick={() => openEditDialog(product)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden relative flex-shrink-0">
                                {product.image_url ? (
                                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[250px]">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.product_type}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">৳{product.price}</span>
                              {comparePrice && comparePrice > product.price && (
                                <span className="text-xs text-muted-foreground line-through">৳{comparePrice}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.discount && product.discount > 0 ? (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{product.discount}% OFF</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={cn('font-medium tabular-nums', isOut && 'text-destructive', isLow && 'text-warning')}>{stock}</span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Switch checked={pActive} onCheckedChange={(v) => handleToggleActive(product.id, v)} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Switch checked={pFeatured} onCheckedChange={(v) => handleToggleFeatured(product.id, v)} />
                          </TableCell>
                          <TableCell>{getStockBadge(stock)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover z-50">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(product); }}>
                                  <Edit2 className="h-4 w-4 mr-2" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setQuickStockEdit({ id: product.id, stock: stock.toString() }); }}>
                                  <PackagePlus className="h-4 w-4 mr-2" />Quick Stock Update
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive"
                                  onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setIsDeleteOpen(true); }}>
                                  <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="p-3 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Showing {filteredProducts.length} of {products?.length || 0} products
                  {stockFilter !== 'all' && (
                    <button className="ml-2 text-primary hover:underline" onClick={() => setStockFilter('all')}>Clear filter</button>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Quick Stock Update Dialog */}
      <Dialog open={!!quickStockEdit} onOpenChange={(open) => !open && setQuickStockEdit(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Update Stock</DialogTitle>
            <DialogDescription className="text-sm">Enter the new stock quantity.</DialogDescription>
          </DialogHeader>
          {quickStockEdit && (
            <div className="py-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"
                  onClick={() => setQuickStockEdit({ ...quickStockEdit, stock: Math.max(0, parseInt(quickStockEdit.stock) - 1).toString() })}>
                  <PackageMinus className="h-4 w-4" />
                </Button>
                <Input type="number" value={quickStockEdit.stock}
                  onChange={(e) => setQuickStockEdit({ ...quickStockEdit, stock: e.target.value })}
                  className="h-12 text-center text-lg font-bold rounded-xl"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuickStockUpdate(quickStockEdit.id, parseInt(quickStockEdit.stock) || 0); }} />
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"
                  onClick={() => setQuickStockEdit({ ...quickStockEdit, stock: (parseInt(quickStockEdit.stock) + 1).toString() })}>
                  <PackagePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setQuickStockEdit(null)} className="rounded-xl h-11 sm:h-10">Cancel</Button>
            <Button onClick={() => quickStockEdit && handleQuickStockUpdate(quickStockEdit.id, parseInt(quickStockEdit.stock) || 0)} className="rounded-xl h-11 sm:h-10">Update Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add New Product</DialogTitle>
            <DialogDescription className="text-sm">Fill in the details to add a new product.</DialogDescription>
          </DialogHeader>
          <ProductFormFields formData={formData} onChange={setFormData} />
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl h-11 sm:h-10">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="rounded-xl h-11 sm:h-10">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Product</DialogTitle>
            <DialogDescription className="text-sm">Update the product details.</DialogDescription>
          </DialogHeader>
          <ProductFormFields formData={formData} onChange={setFormData} />
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl h-11 sm:h-10">Cancel</Button>
            <Button onClick={handleEdit} disabled={saving} className="rounded-xl h-11 sm:h-10">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl h-11 sm:h-10">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="rounded-xl h-11 sm:h-10">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Manage Categories</DialogTitle>
            <DialogDescription className="text-sm">Add, edit, or remove product categories.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Add new category */}
            <div className="flex gap-2">
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name" className="h-10 rounded-xl text-sm flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }} />
              <Button onClick={handleAddCategory} disabled={!newCategoryName.trim() || addCategory.isPending}
                className="h-10 rounded-xl text-sm px-4">
                {addCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            {/* Category list */}
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.slug} · {cat.product_count} products</p>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{cat.is_active ? 'Active' : 'Inactive'}</span>
                      <Switch checked={cat.is_active}
                        onCheckedChange={(v) => updateCategory.mutate({ id: cat.id, updates: { is_active: v } })} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (cat.product_count > 0) {
                          toast.error(`Cannot delete: ${cat.product_count} products use this category. Reassign them first.`);
                        } else {
                          deleteCategory.mutate(cat.id);
                        }
                      }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No categories yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CSVImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <PDFImportDialog open={isPDFImportOpen} onOpenChange={setIsPDFImportOpen} />
    </AdminLayout>
  );
};

export default AdminProducts;
