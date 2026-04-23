import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
const ProductCard = lazy(() => import('@/components/ProductCard'));
import ProductReviewForm from '@/components/ProductReviewForm';
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  Heart,
  Package,
  RefreshCw,
  Check,
  Minus,
  Plus,
  Share2,
  ChevronRight,
} from 'lucide-react';
import type { Product, Review } from '@/types/database';
import { Separator } from '@/components/ui/separator';
import SEO from '@/components/SEO';
import { STALE_2MIN, STALE_5MIN } from '@/lib/queryConstants';

const PRODUCT_COLS =
  'id, name, price, category, product_type, description, image_url, images, stock, badge, discount, created_at, is_featured, is_active, compare_price, sku';

const RELATED_COLS =
  'id, name, price, category, image_url, badge, discount, stock';

const REVIEWS_PAGE_SIZE = 20;

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600';

/**
 * Outer guard — bounces malformed/missing :id to /shop before any hooks
 * mount. Keeps the inner component's hook order stable.
 */
const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/shop" replace />;
  return <ProductDetailPageInner id={id} />;
};

const ProductDetailPageInner = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addProduct: addToRecentlyViewed } = useRecentlyViewed();
  const wishlisted = isWishlisted(id);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewsLimit, setReviewsLimit] = useState(REVIEWS_PAGE_SIZE);
  const reviewsSectionRef = useRef<HTMLDivElement | null>(null);
  // Tracks whether we've already pushed this product into recently-viewed
  // for the current `id` so reloads don't keep rewriting localStorage.
  const recentlyViewedTrackedRef = useRef<string | null>(null);

  // ── Product (canonical) ───────────────────────────────────────────────────
  const {
    data: product,
    isLoading: productLoading,
    isError: productError,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLS)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Product | null;
    },
    staleTime: STALE_2MIN,
  });

  // ── Related (slim columns; only what ProductCard renders) ─────────────────
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['product-related', id, product?.category],
    enabled: !!product?.category,
    staleTime: STALE_5MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(RELATED_COLS)
        .eq('category', product!.category)
        .eq('is_active', true)
        .neq('id', id)
        .limit(4);
      if (error) throw error;
      return (data ?? []) as Pick<
        Product,
        'id' | 'name' | 'price' | 'category' | 'image_url' | 'badge' | 'discount' | 'stock'
      >[];
    },
  });

  // ── Reviews (paginated; aggregate counts come from a separate cheap call) ─
  const {
    data: reviews = [],
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['product-reviews', id, reviewsLimit],
    staleTime: STALE_2MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, product_id, user_id, rating, comment, created_at')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(reviewsLimit);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  // Aggregate (avg + count + per-star distribution) from the public view —
  // covers ALL reviews, not just the loaded page.
  const { data: ratingSummary } = useQuery({
    queryKey: ['product-rating-summary', id],
    staleTime: STALE_5MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ratings' as never)
        .select('avg_rating, review_count')
        .eq('product_id', id)
        .maybeSingle();
      if (error) throw error;
      const row = data as { avg_rating: number | string | null; review_count: number | null } | null;
      return {
        avgRating: Number(row?.avg_rating ?? 0),
        reviewCount: Number(row?.review_count ?? 0),
      };
    },
  });

  // Reset gallery selection + visible reviews window when navigating between
  // products so we don't dereference an out-of-bounds image index.
  useEffect(() => {
    setSelectedImage(0);
    setReviewsLimit(REVIEWS_PAGE_SIZE);
    setQuantity(1);
  }, [id]);

  // Track recently viewed exactly once per loaded product.
  useEffect(() => {
    if (!product) return;
    if (recentlyViewedTrackedRef.current === product.id) return;
    recentlyViewedTrackedRef.current = product.id;
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || '',
      category: product.category,
      discount: product.discount,
      badge: product.badge,
      stock: product.stock,
    });
  }, [product, addToRecentlyViewed]);

  const productImages = useMemo(() => {
    if (!product) return [PLACEHOLDER_IMAGE];
    const arr = product.images?.length
      ? product.images
      : product.image_url
        ? [product.image_url]
        : [];
    return arr.length > 0 ? arr : [PLACEHOLDER_IMAGE];
  }, [product]);

  const discountedPrice = product?.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : product?.price ?? 0;

  const savings = product?.discount ? product.price - discountedPrice : 0;

  const avgRating = ratingSummary?.avgRating ?? 0;
  const reviewCount = ratingSummary?.reviewCount ?? 0;

  // Stock-aware quantity bounds — the Plus button is disabled at the cap.
  const stockCap = product?.stock ?? Infinity;
  const canIncrement = quantity < stockCap;

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.discount
        ? Math.round(product.price * (1 - product.discount / 100))
        : product.price,
      image: product.image_url || '',
      category: product.category,
      stock: product.stock ?? undefined,
      // Add full quantity in a single store update instead of looping.
      quantity,
    });
    toast.success(`${quantity} item(s) added to cart!`);
  }, [product, addItem, quantity]);

  const handleScrollToReviews = useCallback(() => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleShare = useCallback(async () => {
    if (!product) return;
    const url = `${window.location.origin}/product/${product.id}`;
    const shareData = {
      title: product.name,
      text: product.description || `${product.name} — Z Agro Tech`,
      url,
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('Product link copied to clipboard');
        return;
      }
    } catch {
      // user-cancelled share — silently ignore
      return;
    }
    toast.info('Sharing is not supported on this device');
  }, [product]);

  if (productLoading) {
    return (
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <div className="aspect-square bg-muted animate-pulse rounded-2xl" />
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            </div>
            {/* Info Skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="h-12 w-48 bg-muted animate-pulse rounded" />
              <div className="h-24 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Friendly error state — product not found or network failure
  if (productError || !product) {
    return (
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Package className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Product Not Found</h2>
            <p className="text-muted-foreground">This product may have been removed or the link is incorrect.</p>
          </div>
          <Button onClick={() => navigate('/shop')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  // SEO structured data for product
  const productSchema = {
    type: 'Product' as const,
    name: product.name,
    description: product.description || undefined,
    image: product.image_url || undefined,
    price: discountedPrice,
    priceCurrency: 'BDT',
    availability: (product.stock && product.stock > 0 ? 'InStock' : 'OutOfStock') as 'InStock' | 'OutOfStock',
    brand: 'Z Agro Tech',
    category: product.category,
    rating: avgRating,
    reviewCount: reviewCount || undefined,
    sku: product.id,
    url: `https://zagrotech.lovable.app/product/${product.id}`,
  };

  const breadcrumbSchema = {
    type: 'BreadcrumbList' as const,
    items: [
      { name: 'Home', url: 'https://zagrotech.lovable.app/' },
      { name: 'Shop', url: 'https://zagrotech.lovable.app/shop' },
      { name: product.name, url: `https://zagrotech.lovable.app/product/${product.id}` },
    ],
  };

  const isOutOfStock = product.stock !== null && product.stock <= 0;
  const showMoreReviewsButton = reviews.length < reviewCount;

  return (
    <div className="bg-muted/30 pb-24 lg:pb-0">
      <SEO
        title={product.name}
        description={product.description || `Buy ${product.name} at Z Agro Tech. Premium ${product.category} for modern farmers in Bangladesh.`}
        image={product.image_url || undefined}
        url={`https://zagrotech.lovable.app/product/${product.id}`}
        type="product"
        schema={[productSchema, breadcrumbSchema]}
        canonicalUrl={`https://zagrotech.lovable.app/product/${product.id}`}
      />

      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">
              Home
            </button>
            <ChevronRight className="h-4 w-4" />
            <button onClick={() => navigate('/shop')} className="hover:text-primary transition-colors">
              Shop
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <main id="main-content" className="container mx-auto px-4 py-6 lg:py-10 animate-page-enter">
        {/* Back Button - Mobile Only */}
        <button
          onClick={() => navigate(-1)}
          className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Product Images - Left Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-background rounded-2xl overflow-hidden border border-border shadow-sm">
              <img
                src={productImages[selectedImage] || PLACEHOLDER_IMAGE}
                alt={product.name}
                className="w-full h-full object-contain p-4"
                loading="eager"
                decoding="async"
                width={600}
                height={600}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.badge && (
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {product.badge}
                  </span>
                )}
                {product.discount && (
                  <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
              {/* Wishlist & Share */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => toggleWishlist(id)}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    wishlisted
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-background border border-border hover:border-primary'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${wishlisted ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Share product"
                  className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-primary transition-all shadow-sm"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    aria-label={`View image ${idx + 1} of ${productImages.length}`}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} — thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      width={80}
                      height={80}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Middle Column */}
          <div className="lg:col-span-4 space-y-5">
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                {product.product_type || product.category}
              </span>
              {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
                <span className="text-xs bg-warning-light text-warning-foreground dark:bg-warning-light/30 dark:text-warning font-medium px-3 py-1 rounded-full">
                  Only {product.stock} left!
                </span>
              )}
              {product.stock !== null && product.stock > 5 && (
                <span className="text-xs text-success font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  In Stock
                </span>
              )}
              {product.stock !== null && product.stock === 0 && (
                <span className="text-xs bg-destructive/10 text-destructive font-semibold px-3 py-1 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(avgRating)
                        ? 'text-warning fill-warning'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">
                {avgRating.toFixed(1)}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <button
                onClick={handleScrollToReviews}
                className="text-sm text-primary hover:underline"
              >
                {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
              </button>
            </div>

            <Separator />

            {/* Price Section */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                  ৳{discountedPrice.toLocaleString()}
                </span>
                {product.discount && (
                  <span className="text-lg text-muted-foreground line-through">
                    ৳{product.price.toLocaleString()}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-sm text-success font-medium">
                  You save ৳{savings.toLocaleString()} ({product.discount}% off)
                </p>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">About this item</h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {product.description || 'Premium-grade agriculture supply sourced for Bangladeshi farms. Carefully selected for quality, yield, and reliability — built to help every grower do more with less.'}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">100% Authentic & Genuine Product</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Quality Tested & Approved</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Secure & Safe Packaging</span>
              </div>
            </div>
          </div>

          {/* Buy Box - Right Column (sticky on desktop, inline on mobile) */}
          <div className="lg:col-span-3">
            <div className="hidden lg:block bg-background rounded-2xl border border-border p-5 space-y-5 sticky top-24 shadow-sm">
              {/* Price in Buy Box */}
              <div>
                <span className="text-2xl font-bold text-foreground">
                  ৳{discountedPrice.toLocaleString()}
                </span>
                {product.discount && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    ৳{product.price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Delivery Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Free Delivery</p>
                    <p className="text-xs text-muted-foreground">Orders over ৳500</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Express Delivery</p>
                    <p className="text-xs text-muted-foreground">Get it within 2-3 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Easy Returns</p>
                    <p className="text-xs text-muted-foreground">7 days return policy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Secure Payment</p>
                    <p className="text-xs text-muted-foreground">100% secure checkout</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quantity</label>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="h-10 w-10 rounded-l-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="h-10 w-14 border-y border-border flex items-center justify-center font-medium">
                    {quantity}
                  </div>
                  <button
                    onClick={() => canIncrement && setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="h-10 w-10 rounded-r-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                    disabled={!canIncrement}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {product.stock !== null && quantity >= product.stock && product.stock > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Maximum available: {product.stock}
                  </p>
                )}
              </div>

              {/* Add to Cart Button */}
              <Button
                className="w-full h-12 text-base font-semibold rounded-xl"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>

              {/* Buy Now Button */}
              {!isOutOfStock && (
                <Button
                  variant="warm"
                  className="w-full h-12 text-base font-semibold rounded-xl"
                  onClick={() => {
                    handleAddToCart();
                    navigate('/checkout');
                  }}
                >
                  Buy Now
                </Button>
              )}

              {/* Wishlist Button */}
              <Button
                variant="ghost"
                className="w-full h-10"
                onClick={() => toggleWishlist(id)}
              >
                <Heart className={`h-4 w-4 mr-2 ${wishlisted ? 'fill-destructive text-destructive' : ''}`} />
                {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>

          {/* Mobile inline buy info — kept above sticky bar for delivery/return context */}
          <div className="lg:hidden bg-background rounded-2xl border border-border p-4 space-y-4 shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">
                ৳{discountedPrice.toLocaleString()}
              </span>
              {product.discount && (
                <span className="text-sm text-muted-foreground line-through">
                  ৳{product.price.toLocaleString()}
                </span>
              )}
              {savings > 0 && (
                <span className="text-xs text-success font-medium ml-auto">Save ৳{savings.toLocaleString()}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Free over ৳500</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4 text-primary flex-shrink-0" />
                <span>2-3 days delivery</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 text-primary flex-shrink-0" />
                <span>7 days return</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Secure payment</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Quantity</label>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="h-9 w-9 rounded-l-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="h-9 w-12 border-y border-border flex items-center justify-center font-medium text-sm">
                  {quantity}
                </div>
                <button
                  onClick={() => canIncrement && setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                  className="h-9 w-9 rounded-r-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={!canIncrement}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div ref={reviewsSectionRef} id="reviews" className="mt-12 lg:mt-16 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Customer Reviews
            </h2>
            <span className="text-sm text-muted-foreground">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Review Form */}
          <ProductReviewForm productId={id} onReviewSubmitted={refetchReviews} />

          {reviews.length > 0 && (
            <div className="mt-6">
              {/* Rating Summary */}
              <div className="bg-background rounded-xl border border-border p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</div>
                    <div className="flex justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(avgRating)
                              ? 'text-warning fill-warning'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {reviewCount} reviews
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-16 hidden sm:block" />
                  <div className="flex-1 space-y-2 w-full">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      // Distribution computed over the loaded page only — for
                      // very long review lists this is an approximation.
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-8">{rating} ★</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-warning rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Review Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-background rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">U</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">Customer Review</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating
                                    ? 'text-warning fill-warning'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment || 'Great product! Highly recommended.'}
                    </p>
                  </div>
                ))}
              </div>

              {showMoreReviewsButton && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setReviewsLimit((n) => n + REVIEWS_PAGE_SIZE)}
                  >
                    Load more reviews
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 lg:mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Related Products
              </h2>
              <Button variant="ghost" className="text-primary" asChild>
                <Link to={`/shop?type=${product.product_type || product.category || ''}`}>
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <Suspense fallback={
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />)}
              </div>
            }>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    category={p.category}
                    image={p.image_url || ''}
                    badge={p.badge || undefined}
                    discount={p.discount || undefined}
                    stock={p.stock}
                  />
                ))}
              </div>
            </Suspense>
          </div>
        )}
      </main>

      {/* Sticky-bottom mobile Add to Cart bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_-2px_hsl(var(--foreground)/0.08)]">
        <div className="container mx-auto flex items-center gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-foreground leading-tight">
              ৳{(discountedPrice * quantity).toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">Qty: {quantity}</span>
          </div>
          <Button
            className="flex-1 h-11 text-sm font-semibold rounded-xl"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Out of Stock' : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Add to Cart
              </>
            )}
          </Button>
          {!isOutOfStock && (
            <Button
              variant="warm"
              className="h-11 text-sm font-semibold rounded-xl px-4"
              onClick={() => {
                handleAddToCart();
                navigate('/checkout');
              }}
            >
              Buy Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
