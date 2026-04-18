/**
 * Adapter — re-exports the canonical `ProductCard` so Featured/Wishlist grids
 * render identically to the Shop grid (wishlist heart, ratings, discount UI,
 * memoization). The legacy `ShopProduct` shape is mapped to the canonical
 * props to avoid breaking existing call sites.
 */
import CanonicalProductCard from '@/components/ProductCard';

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  compare_price?: number | null;
  image_url?: string | null;
  category: string;
  stock?: number | null;
  description?: string | null;
}

export const ProductCard = ({ product }: { product: ShopProduct }) => {
  // Derive a percentage discount from compare_price when present.
  const discount =
    product.compare_price && product.compare_price > product.price
      ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
      : null;

  // Use the original (compare) price as the canonical "price" when discount
  // exists, so the canonical card can re-derive a final price internally.
  const displayPrice = discount ? (product.compare_price as number) : product.price;

  return (
    <CanonicalProductCard
      id={product.id}
      name={product.name}
      price={displayPrice}
      category={product.category}
      image={product.image_url || ''}
      stock={product.stock ?? undefined}
      discount={discount}
    />
  );
};

export default ProductCard;
