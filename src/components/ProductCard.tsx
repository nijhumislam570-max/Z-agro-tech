import { memo, forwardRef } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { prefetchRoute } from '@/lib/imageUtils';

interface ProductCardProps {
  id?: string;
  name: string;
  price: number;
  category: string;
  image: string;
  badge?: string | null;
  discount?: number | null;
  stock?: number | null;
  avgRating?: number;
  reviewCount?: number;
}

const ProductCard = memo(forwardRef<HTMLDivElement, ProductCardProps>(({ id, name, price, category, image, badge, discount, stock, avgRating, reviewCount }, ref) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const productPath = id ? `/product/${id}` : '/shop';
  const prefetchHandlers = { onMouseEnter: () => prefetchRoute(productPath), onTouchStart: () => prefetchRoute(productPath) };
  
  const finalPrice = discount ? Math.round(price * (1 - discount / 100)) : price;
  const originalPrice = discount ? price : null;
  const wishlisted = id ? isWishlisted(id) : false;
  const isOutOfStock = stock !== null && stock !== undefined && stock <= 0;
  const isLowStock = stock !== null && stock !== undefined && stock > 0 && stock <= 5;
  // Guard against stale "Stock Out" badge when stock > 0
  const displayBadge = badge && !(badge.toLowerCase() === 'stock out' && stock !== null && stock !== undefined && stock > 0) ? badge : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({ id: id || name, name, price: finalPrice, image, category });
    toast.success(name + ' added to cart!');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.info('Please log in to save items');
      return;
    }
    if (id) toggleWishlist(id);
  };

  return (
    <div
      ref={ref}
      className="group bg-card rounded-lg sm:rounded-xl overflow-hidden shadow-card hover:shadow-hover border border-border transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer card-contain"
      onClick={() => id && navigate(`/product/${id}`)}
      {...prefetchHandlers}
    >
      {/* Image Container with AspectRatio for CLS prevention */}
      <AspectRatio ratio={1} className="overflow-hidden bg-secondary/30">
        <OptimizedImage
          src={image}
          alt={name}
          preset="thumbnail"
          width={300}
          height={300}
          className={`w-full h-full ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
          style={{ transition: 'transform 500ms' }}
        />
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
            <span className="bg-destructive text-destructive-foreground text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              Stock Out
            </span>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-col gap-0.5 sm:gap-1 z-10">
          {displayBadge && (
            <span className="badge-rx text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5">{displayBadge}</span>
          )}
          {discount && !isOutOfStock && (
            <span className="badge-sale text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5">{discount}%</span>
          )}
          {isLowStock && (
            <span className="bg-amber-500 text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-medium">
              {stock} left
            </span>
          )}
        </div>
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-1 sm:top-2 right-1 sm:right-2 h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-all active:scale-90 z-10 ${
            wishlisted 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-card/80 backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 hover:bg-card'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>
      </AspectRatio>

      {/* Content */}
      <div className="p-1.5 sm:p-2.5 space-y-1 sm:space-y-1.5">
        <h3 className="font-medium text-[10px] sm:text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[24px] sm:min-h-[32px] leading-tight">
          {name}
        </h3>
        
        {/* Rating Display */}
        {avgRating !== undefined && avgRating > 0 && (
          <div className="flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400 fill-amber-400" />
            <span className="text-[9px] sm:text-[10px] font-medium text-foreground">{avgRating.toFixed(1)}</span>
            {reviewCount !== undefined && reviewCount > 0 && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">({reviewCount})</span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-1 sm:gap-1.5">
          <span className="text-xs sm:text-base font-bold text-foreground">৳{finalPrice.toLocaleString()}</span>
          {originalPrice && (
            <span className="text-[8px] sm:text-xs text-muted-foreground line-through">
              ৳{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <Button 
          variant={isOutOfStock ? "secondary" : "default"}
          size="sm"
          className="w-full h-6 sm:h-8 text-[10px] sm:text-xs rounded-md sm:rounded-lg active:scale-95" 
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}));

ProductCard.displayName = 'ProductCard';

export default ProductCard;
