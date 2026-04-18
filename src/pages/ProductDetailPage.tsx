import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
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
  ChevronRight
} from 'lucide-react';
import type { Product, Review } from '@/types/database';
import { Separator } from '@/components/ui/separator';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import SEO from '@/components/SEO';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addProduct: addToRecentlyViewed } = useRecentlyViewed();
  const wishlisted = id ? isWishlisted(id) : false;
  
  useDocumentTitle(product?.name || 'Product Details');

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false });
    if (reviewsData) setReviews(reviewsData as Review[]);
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        setFetchError(true);
        setLoading(false);
        return;
      }

      setProduct(data as Product);

      // Track recently viewed
      addToRecentlyViewed({
        id: data.id,
        name: data.name,
        price: data.price,
        image: data.image_url || '',
        category: data.category,
        discount: data.discount,
        badge: data.badge,
        stock: data.stock,
      });

      // Fetch related products
      const { data: related } = await supabase
        .from('products')
        .select('*')
        .eq('category', data.category)
        .neq('id', id)
        .limit(4);

      if (related) setRelatedProducts(related as Product[]);

      // Fetch reviews
      await fetchReviews();

      setLoading(false);
    };

    fetchProduct();
  }, [id, navigate, fetchReviews]);

  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.discount 
          ? Math.round(product.price * (1 - product.discount / 100))
          : product.price,
        image: product.image_url || '',
        category: product.category,
      });
    }
    
    toast.success(`${quantity} item(s) added to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
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
  if (fetchError || !product) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
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
        <MobileNav />
      </div>
    );
  }


  const discountedPrice = product.discount 
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  // Create image gallery from product images or use main image
  const productImages = product.images?.length 
    ? product.images 
    : [product.image_url || ''];

  const savings = product.discount 
    ? product.price - discountedPrice 
    : 0;
    
  // SEO structured data for product
  const productSchema = {
    type: 'Product' as const,
    name: product.name,
    description: product.description || undefined,
    image: product.image_url || undefined,
    price: discountedPrice,
    priceCurrency: 'BDT',
    availability: (product.stock && product.stock > 0 ? 'InStock' : 'OutOfStock') as 'InStock' | 'OutOfStock',
    brand: 'VetMedix',
    category: product.category,
    rating: avgRating,
    reviewCount: reviews.length || undefined,
    sku: product.id,
    url: `https://vetmedix.lovable.app/product/${product.id}`,
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      <SEO 
        title={product.name}
        description={product.description || `Buy ${product.name} at VetMedix. Premium ${product.category} products for your pets.`}
        image={product.image_url || undefined}
        url={`https://vetmedix.lovable.app/product/${product.id}`}
        type="product"
        schema={productSchema}
        canonicalUrl={`https://vetmedix.lovable.app/product/${product.id}`}
      />
      <Navbar />
      
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

      <main id="main-content" className="container mx-auto px-4 py-6 lg:py-10">
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
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain p-4"
                loading="eager"
                decoding="async"
                width={600}
                height={600}
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
                  onClick={() => id && toggleWishlist(id)}
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
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" width={80} height={80} />
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
                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium px-3 py-1 rounded-full">
                  Only {product.stock} left!
                </span>
              )}
              {product.stock !== null && product.stock > 5 && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  In Stock
                </span>
              )}
              {(product.stock === null || product.stock === 0) && product.stock !== null && (
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
                        ? 'text-amber-400 fill-amber-400' 
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">
                {avgRating.toFixed(1)}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <button className="text-sm text-primary hover:underline">
                {reviews.length} Reviews
              </button>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">
                100+ Sold
              </span>
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
                <p className="text-sm text-green-600 font-medium">
                  You save ৳{savings.toLocaleString()} ({product.discount}% off)
                </p>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">About this item</h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {product.description || 'Premium quality product for your beloved pets and farm animals. Made with the finest ingredients and materials to ensure the health and happiness of your animals.'}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">100% Authentic & Genuine Product</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Quality Tested & Approved</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Secure & Safe Packaging</span>
              </div>
            </div>
          </div>

          {/* Buy Box - Right Column (sticky bottom on mobile) */}
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
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="h-10 w-10 rounded-r-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button 
                className="w-full h-12 text-base font-semibold rounded-xl"
                onClick={handleAddToCart}
                disabled={product.stock !== null && product.stock <= 0}
              >
                {product.stock !== null && product.stock <= 0 ? (
                  'Out of Stock'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>

              {/* Buy Now Button */}
              {(product.stock === null || product.stock > 0) && (
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
                onClick={() => id && toggleWishlist(id)}
              >
                <Heart className={`h-4 w-4 mr-2 ${wishlisted ? 'fill-destructive text-destructive' : ''}`} />
                {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>
          
          {/* Mobile Buy Box - also render for smaller screens */}
          <div className="lg:hidden bg-background rounded-2xl border border-border p-4 space-y-4 shadow-sm">
              {/* Price in Buy Box */}
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
                  <span className="text-xs text-green-600 font-medium ml-auto">Save ৳{savings.toLocaleString()}</span>
                )}
              </div>

              {/* Delivery Info - compact */}
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

              {/* Quantity Selector */}
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
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="h-9 w-9 rounded-r-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1 h-11 text-sm font-semibold rounded-xl"
                  onClick={handleAddToCart}
                  disabled={product.stock !== null && product.stock <= 0}
                >
                  {product.stock !== null && product.stock <= 0 ? 'Out of Stock' : (
                    <><ShoppingCart className="h-4 w-4 mr-1.5" />Add to Cart</>
                  )}
                </Button>
                {(product.stock === null || product.stock > 0) && (
                  <Button 
                    variant="warm"
                    className="flex-1 h-11 text-sm font-semibold rounded-xl"
                    onClick={() => { handleAddToCart(); navigate('/checkout'); }}
                  >
                    Buy Now
                  </Button>
                )}
              </div>
            </div>
        </div>

        {/* Reviews Section - always show */}
        <div className="mt-12 lg:mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Customer Reviews
            </h2>
            <span className="text-sm text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Review Form */}
          {id && <ProductReviewForm productId={id} onReviewSubmitted={fetchReviews} />}

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
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {reviews.length} reviews
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-16 hidden sm:block" />
                  <div className="flex-1 space-y-2 w-full">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = (count / reviews.length) * 100;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-8">{rating} ★</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-400 rounded-full" 
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
                        <p className="font-medium text-sm text-foreground">Verified Buyer</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating 
                                    ? 'text-amber-400 fill-amber-400' 
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
                <Link to={`/shop?type=${product?.product_type || ''}`}>
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <Suspense fallback={
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />)}
              </div>
            }>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    category={p.category as 'Pet' | 'Farm'}
                    image={p.image_url || ''}
                    badge={p.badge || undefined}
                    discount={p.discount || undefined}
                  />
                ))}
              </div>
            </Suspense>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
};

export default ProductDetailPage;
