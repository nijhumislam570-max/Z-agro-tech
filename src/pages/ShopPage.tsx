import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid3X3, LayoutGrid, Package, X, Sparkles, ShoppingCart, Heart, Clock, Tag, Truck, Shield } from 'lucide-react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProductCategories } from '@/hooks/useProductCategories';
import SEO from '@/components/SEO';
import shopHeroAgriculture from '@/assets/shop-hero-agriculture.jpg';
import { STALE_2MIN, STALE_5MIN } from '@/lib/queryConstants';
import { escapeIlikePattern } from '@/lib/searchUtils';

const GRID_COLS_STORAGE_KEY = 'zagrotech-shop-grid-cols';
const FEATURED_LIMIT = 10;

// Price range options outside component to prevent recreation
const priceRangeOptions = [
  { value: 'all', label: 'All Prices' },
  { value: 'under500', label: 'Under ৳500' },
  { value: '500to1000', label: '৳500 - ৳1000' },
  { value: 'over1000', label: 'Over ৳1000' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Best Discount' },
  { value: 'top-rated', label: 'Top Rated' },
];

const PAGE_SIZE = 20;

// Product type from database
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  product_type: string | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  stock: number | null;
  badge: string | null;
  discount: number | null;
  created_at: string;
  is_featured: boolean | null;
  is_active: boolean | null;
  compare_price: number | null;
  sku: string | null;
}

// Skeleton card matching ProductCard shape
const ProductCardSkeleton = memo(() => (
  <div className="bg-background rounded-xl sm:rounded-2xl border border-border overflow-hidden" aria-hidden="true">
    <Skeleton className="aspect-square w-full" />
    <div className="p-1.5 sm:p-2.5 space-y-1.5">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-6 sm:h-8 w-full rounded-md" />
    </div>
  </div>
));
ProductCardSkeleton.displayName = 'ProductCardSkeleton';

// Hero Carousel Component
const HeroCarousel = memo(({ products }: { products: Product[] }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  
  const featured = useMemo(() => {
    // Single pass: bucket products into admin-featured, discounted, and
    // generic-active groups while iterating once instead of running .filter()
    // three times over the same array.
    const adminFeatured: Product[] = [];
    const discounted: Product[] = [];
    const activeWithImage: Product[] = [];
    for (const p of products) {
      if (p.is_active === false || !p.image_url) continue;
      activeWithImage.push(p);
      if (p.is_featured) adminFeatured.push(p);
      if (p.discount && p.discount > 0) discounted.push(p);
    }
    if (adminFeatured.length > 0) return adminFeatured.slice(0, 8);
    const pool = discounted.length >= 5 ? discounted : activeWithImage;
    return pool.slice(0, 5);
  }, [products]);

  useEffect(() => {
    if (featured.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % featured.length);
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % featured.length);
    }, 3500);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const p = featured[current];
  const discountedPrice = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
  const strikethroughPrice = p.compare_price || (p.discount ? p.price : null);

  return (
    <div className="flex gap-3 sm:gap-4 items-center">
      <Link 
        to={`/product/${p.id}`}
        className="relative w-[200px] sm:w-[240px] lg:w-[260px] bg-background rounded-2xl border border-border shadow-card overflow-hidden group transition-all hover:shadow-hover"
      >
        <div className="aspect-square overflow-hidden bg-secondary/20">
          <img
            src={p.image_url || ''}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="eager"
            decoding="async"
            width={260}
            height={260}
          />
          {p.discount && (
            <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
              {p.discount}% OFF
            </span>
          )}
          {p.is_featured && (
            <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{p.name}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-primary">৳{discountedPrice.toLocaleString()}</span>
            {strikethroughPrice && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">৳{strikethroughPrice.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-1.5 lg:gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === current 
                ? 'w-2.5 h-2.5 bg-primary' 
                : 'w-2 h-2 bg-border hover:bg-muted-foreground/40'
            }`}
            aria-label={`Show product ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
});
HeroCarousel.displayName = 'HeroCarousel';

const ShopPage = () => {
  useDocumentTitle('Shop');
  const { totalItems } = useCart();
  const { wishlistIds } = useWishlist();
  const { recentProducts } = useRecentlyViewed();
  const { categories: dbCategories } = useProductCategories();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const searchQuery = useDebounce(searchInput, 300);
  const [productType, setProductType] = useState(searchParams.get('type') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [gridCols, setGridColsState] = useState<3 | 4 | 6>(() => {
    if (typeof window === 'undefined') return 4;
    const stored = window.localStorage.getItem(GRID_COLS_STORAGE_KEY);
    const parsed = stored ? Number(stored) : NaN;
    return parsed === 3 || parsed === 4 || parsed === 6 ? (parsed as 3 | 4 | 6) : 4;
  });
  const setGridCols = useCallback((next: 3 | 4 | 6) => {
    setGridColsState(next);
    try {
      window.localStorage.setItem(GRID_COLS_STORAGE_KEY, String(next));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, []);
  const [priceRange, setPriceRange] = useState<'all' | 'under500' | '500to1000' | 'over1000'>(
    (searchParams.get('price') as 'all' | 'under500' | '500to1000' | 'over1000') || 'all'
  );

  // Sync filter state → URL search params for shareable views
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (productType !== 'All') params.set('type', productType);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (priceRange !== 'all') params.set('price', priceRange);
    setSearchParams(params, { replace: true });
  }, [searchQuery, productType, sortBy, priceRange, setSearchParams]);

  // ── Featured products query (capped — carousel only displays a handful) ───
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, product_type, description, image_url, images, stock, badge, discount, created_at, is_featured, is_active, compare_price, sku')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(FEATURED_LIMIT);
      if (error) throw error;
      return (data || []) as Product[];
    },
    staleTime: STALE_5MIN,
  });

  // ── Infinite scroll products query ────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['shop-products', searchQuery, productType, priceRange, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('products')
        .select('id, name, price, category, product_type, description, image_url, images, stock, badge, discount, created_at, is_featured, is_active, compare_price, sku')
        .eq('is_active', true)
        .range(from, to);

      // Escape `%` and `_` so user input can't inject LIKE wildcards
      // (security/perf: a stray `%` would otherwise match every row).
      if (searchQuery) query = query.ilike('name', `%${escapeIlikePattern(searchQuery)}%`);
      if (productType !== 'All') query = query.eq('category', productType);

      if (priceRange === 'under500') query = query.lt('price', 500);
      else if (priceRange === '500to1000') query = query.gte('price', 500).lte('price', 1000);
      else if (priceRange === 'over1000') query = query.gt('price', 1000);

      // top-rated falls back to client-side sort; all others are server-side
      if (sortBy === 'price-low') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-high') query = query.order('price', { ascending: false });
      else if (sortBy === 'discount') query = query.order('discount', { ascending: false, nullsFirst: false });
      else query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Product[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    staleTime: STALE_2MIN,
  });

  // Flatten pages → single array
  const products = useMemo(() => data?.pages.flat() ?? [], [data]);

  // Client-side sort for top-rated (ratings live in reviews table)
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const ratings = useProductRatings(productIds);

  const sortedProducts = useMemo(() => {
    if (sortBy !== 'top-rated') return products;
    return [...products].sort((a, b) => {
      const rA = ratings[a.id]?.avgRating ?? 0;
      const rB = ratings[b.id]?.avgRating ?? 0;
      return rB - rA;
    });
  }, [products, sortBy, ratings]);

  // Use DB categories for filter options (includes admin-created categories with 0 products)
  const productTypes = useMemo(() => {
    const activeNames = dbCategories
      .filter(c => c.is_active)
      .map(c => c.name)
      .sort((a, b) => a.localeCompare(b));
    // Fallback: also include any category strings from loaded products not yet in the DB table
    const fromProducts = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    const merged = new Set([...activeNames, ...fromProducts]);
    return ['All', ...Array.from(merged).sort((a, b) => a.localeCompare(b))];
  }, [dbCategories, products]);

  // ── Realtime subscription (debounced — admin bulk edits won't thrash) ──────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const invalidateDebounced = (keys: string[]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      }, 400);
    };
    const channel = supabase
      .channel('shop-products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        invalidateDebounced(['shop-products', 'featured-products']);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_categories' }, () => {
        invalidateDebounced(['product-categories']);
      })
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ── Infinite scroll sentinel ───────────────────────────────────────────────
  const { sentinelRef } = useInfiniteScroll(
    () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); },
    { hasMore: !!hasNextPage, isLoading: isFetchingNextPage }
  );

  const activeFiltersCount = [
    productType !== 'All',
    priceRange !== 'all',
    searchInput.length > 0,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setProductType('All');
    setPriceRange('all');
    setSearchInput('');
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
  }, []);

  const gridClass = gridCols === 3
    ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-3'
    : gridCols === 4
      ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

  // Build ItemList schema from up to 10 visible products for storefront SEO
  const shopItemListItems = useMemo(
    () =>
      sortedProducts.slice(0, 10).map((p) => ({
        name: p.name,
        url: `https://zagrotech.lovable.app/product/${p.id}`,
        image: p.image_url || undefined,
        price: p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price,
        priceCurrency: 'BDT',
      })),
    [sortedProducts],
  );

  return (
    <div className="bg-muted/30">
      <SEO
        title="Shop — Premium Agriculture Supplies"
        description="Shop premium seeds, fertilizers, crop-protection, tools and farm equipment from trusted suppliers. Fast nationwide delivery across Bangladesh."
        url="https://zagrotech.lovable.app/shop"
        canonicalUrl="https://zagrotech.lovable.app/shop"
        schema={
          shopItemListItems.length > 0
            ? {
                type: 'ItemList',
                name: 'Z Agro Tech Shop — Featured Products',
                description: 'Premium agriculture supplies in Bangladesh',
                url: 'https://zagrotech.lovable.app/shop',
                itemListType: 'Product',
                items: shopItemListItems,
              }
            : undefined
        }
      />
      
      {/* Hero Banner */}
      <header className="relative overflow-hidden border-b border-border">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={shopHeroAgriculture}
            alt=""
            aria-hidden="true"
            width={1280}
            height={896}
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          {/* Warm gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40 sm:from-background/92 sm:via-background/70 sm:to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-6 sm:py-10 lg:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-5 sm:gap-6">
            {/* Copy column */}
            <div className="space-y-3 sm:space-y-4 sm:col-span-7 lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border border-primary/20 w-fit">
                <Tag className="h-3 w-3" />
                Special Offers
              </span>

              <h1 className="font-bold text-foreground leading-[1.1] tracking-tight text-[1.75rem] sm:text-4xl lg:text-5xl xl:text-6xl">
                Premium Agriculture
                <span className="block text-primary mt-1">Supplies</span>
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed">
                Quality seeds, fertilizers, livestock feed, and farm tools for modern farmers — delivered fast across Bangladesh.
              </p>

              {/* Trust strip — grid on mobile for clean alignment */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2.5 pt-1">
                <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs font-medium text-foreground bg-background/90 backdrop-blur-sm border border-border rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm">
                  <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">Free ৳500+</span>
                </span>
                <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs font-medium text-foreground bg-background/90 backdrop-blur-sm border border-border rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm">
                  <Shield className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="truncate">Authentic</span>
                </span>
                <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs font-medium text-foreground bg-background/90 backdrop-blur-sm border border-border rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm">
                  <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{isLoading ? '…' : `${sortedProducts.length}+ Items`}</span>
                </span>
              </div>
            </div>

            {/* Carousel column — visible on tablet+ */}
            <div className="hidden sm:block sm:col-span-5 lg:col-span-5 relative">
              <HeroCarousel products={featuredProducts.length > 0 ? featuredProducts : products} />
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-4 sm:py-6" role="main" aria-label="Shop products">
        {/* Search, Filter & Sort Bar */}
        <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Row */}
            <div className="flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full h-10 sm:h-11 pl-9 sm:pl-11 pr-4 rounded-lg sm:rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base md:text-sm transition-all"
                  aria-label="Search products"
                />
                {searchQuery && (
                  <button 
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              
              <Link to="/cart" className="relative">
                <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl" aria-label={`Cart${totalItems > 0 ? ` (${totalItems} items)` : ''}`}>
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>


              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="sm:hidden h-10 w-10 relative" aria-label={`Filters${activeFiltersCount > 0 ? ` (${activeFiltersCount} active)` : ''}`}>
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center" aria-hidden="true">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl flex flex-col">
                  <SheetHeader className="text-left flex-shrink-0">
                    <SheetTitle className="text-lg">Filters & Sort</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-5 overflow-y-auto flex-1 pb-6 -mx-1 px-1">
                    {productTypes.length > 2 && (
                      <div className="space-y-2.5">
                        <h3 className="font-semibold text-foreground text-sm" id="mobile-type-label">Category</h3>
                        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="mobile-type-label">
                          {productTypes.map(type => (
                            <button
                              key={type}
                              onClick={() => setProductType(type)}
                              className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-full transition-all active:scale-95 ${
                                productType === type
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                              aria-pressed={productType === type}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="space-y-2.5">
                      <h3 className="font-semibold text-foreground text-sm" id="mobile-price-label">Price Range</h3>
                      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="mobile-price-label">
                        {priceRangeOptions.map(option => (
                          <button 
                            key={option.value} 
                            onClick={() => setPriceRange(option.value as typeof priceRange)}
                            className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-full transition-all active:scale-95 ${
                              priceRange === option.value 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            aria-pressed={priceRange === option.value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2.5">
                      <h3 className="font-semibold text-foreground text-sm" id="mobile-sort-label">Sort By</h3>
                      <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="mobile-sort-label">
                        {sortOptions.map(option => (
                          <button 
                            key={option.value} 
                            onClick={() => setSortBy(option.value)}
                            className={`min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-xl transition-all text-left active:scale-95 ${
                              sortBy === option.value 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            aria-pressed={sortBy === option.value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" onClick={clearFilters} className="w-full min-h-[44px]">
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Filters Row */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Select value={productType} onValueChange={(v) => setProductType(v)}>
                  <SelectTrigger className="w-[160px] h-10 rounded-lg" aria-label="Category filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map(type => (
                      <SelectItem key={type} value={type}>{type === 'All' ? 'All Categories' : type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priceRange} onValueChange={(v: string) => setPriceRange(v as typeof priceRange)}>
                  <SelectTrigger className="w-[150px] h-10 rounded-lg" aria-label="Price range filter">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRangeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground" aria-label="Clear all filters">
                    Clear filters
                    <X className="h-3 w-3 ml-1" aria-hidden="true" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-10 rounded-lg" aria-label="Sort products">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="discount">Best Discount</SelectItem>
                    <SelectItem value="top-rated">Top Rated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden lg:flex items-center bg-muted/50 rounded-lg p-1 border border-border" role="group" aria-label="Grid view options">
                  <button
                    onClick={() => setGridCols(3)}
                    className={`p-2 rounded transition-all ${gridCols === 3 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                    aria-label="View as 3 columns"
                    aria-pressed={gridCols === 3}
                  >
                    <Grid3X3 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={`p-2 rounded transition-all ${gridCols === 4 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                    aria-label="View as 4 columns"
                    aria-pressed={gridCols === 4}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setGridCols(6)}
                    className={`p-2 rounded transition-all ${gridCols === 6 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                    aria-label="View as 6 columns"
                    aria-pressed={gridCols === 6}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="0.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="3.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="6.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="9.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="12.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="0.5" y="5" width="2" height="3" rx="0.5" />
                      <rect x="3.5" y="5" width="2" height="3" rx="0.5" />
                      <rect x="6.5" y="5" width="2" height="3" rx="0.5" />
                      <rect x="9.5" y="5" width="2" height="3" rx="0.5" />
                      <rect x="12.5" y="5" width="2" height="3" rx="0.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="mb-4 sm:mb-6" aria-label="Featured products">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Featured Products</h2>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none -mx-1 px-1 snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:overflow-visible sm:snap-none">
              {featuredProducts.map(product => (
                <div key={product.id} className="flex-shrink-0 w-[130px] sm:w-auto snap-start">
                  <ProductCard 
                    id={product.id} 
                    name={product.name} 
                    price={product.price}
                    category={product.category} 
                    image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'}
                    badge={product.badge} 
                    discount={product.discount}
                    stock={product.stock}
                    avgRating={ratings[product.id]?.avgRating}
                    reviewCount={ratings[product.id]?.reviewCount}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4" role="list" aria-label="Active filters">
            {productType !== 'All' && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs" role="listitem">
                {productType}
                <button onClick={() => setProductType('All')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label={`Remove ${productType} filter`}>
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {priceRange !== 'all' && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs" role="listitem">
                {priceRangeOptions.find(o => o.value === priceRange)?.label}
                <button onClick={() => setPriceRange('all')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Remove price filter">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs" role="listitem">
                "{searchQuery}"
                <button onClick={handleClearSearch} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Remove search filter">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Products Grid */}
        <section className="flex-1 min-h-[400px]" aria-label="Products list">
          {/* Initial loading state: full skeleton grid */}
          {isLoading ? (
            <div className={`grid gap-2 sm:gap-3 ${gridClass}`} aria-busy="true" aria-label="Loading products">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24" role="status">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                {searchQuery 
                  ? `No results for "${searchQuery}". Try a different search term or check the spelling.`
                  : 'Try adjusting your filters to find what you\'re looking for.'}
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>
              <div className={`grid gap-2 sm:gap-3 ${gridClass}`}>
                {sortedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    id={product.id} 
                    name={product.name} 
                    price={product.price}
                    category={product.category} 
                    image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'}
                    badge={product.badge} 
                    discount={product.discount}
                    stock={product.stock}
                    avgRating={ratings[product.id]?.avgRating}
                    reviewCount={ratings[product.id]?.reviewCount}
                  />
                ))}

                {/* Next-page skeleton cards appended below (scroll position preserved) */}
                {isFetchingNextPage && [...Array(4)].map((_, i) => (
                  <ProductCardSkeleton key={`skel-${i}`} />
                ))}
              </div>

              {/* Invisible sentinel triggers fetchNextPage */}
              <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />

              {/* End-of-catalog message */}
              {!hasNextPage && sortedProducts.length >= PAGE_SIZE && (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground" role="status">
                  <Package className="h-6 w-6" />
                  <p className="text-sm">You've viewed all products</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Recently Viewed Section */}
        {recentProducts.length > 0 && (
          <section className="mt-8 sm:mt-12" aria-label="Recently viewed products">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Recently Viewed</h2>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-none -mx-1 px-1">
              {recentProducts.map(product => (
                <div key={product.id} className="flex-shrink-0 w-[160px] sm:w-[200px]">
                  <ProductCard 
                    id={product.id} 
                    name={product.name} 
                    price={product.price}
                    category={product.category} 
                    image={product.image}
                    badge={product.badge} 
                    discount={product.discount}
                    stock={product.stock}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ShopPage;
