import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Leaf } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

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
  const { addItem } = useCart();
  const stock = product.stock ?? 0;
  const inStock = stock > 0;
  const lowStock = inStock && stock <= 5;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || '',
      category: product.category,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <Card className="h-full overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-hover transition-all duration-300">
        <div className="relative aspect-square bg-gradient-to-br from-secondary/40 to-muted/30 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/30">
              <Leaf className="h-16 w-16" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {!inStock && <Badge variant="destructive">Out of stock</Badge>}
            {lowStock && <Badge className="bg-accent text-accent-foreground">Only {stock} left</Badge>}
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-end justify-between gap-2 pt-1">
            <div>
              <p className="text-lg font-bold text-primary">৳{product.price}</p>
              {product.compare_price && product.compare_price > product.price && (
                <p className="text-xs text-muted-foreground line-through">৳{product.compare_price}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-9 w-9 p-0 rounded-full"
              onClick={handleAdd}
              disabled={!inStock}
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
