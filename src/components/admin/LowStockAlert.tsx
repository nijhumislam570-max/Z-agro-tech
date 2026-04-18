import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp, Package, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { LowStockProduct } from '@/hooks/useAdminAnalytics';

interface LowStockAlertProps {
  products: LowStockProduct[];
}

export const LowStockAlert = ({ products }: LowStockAlertProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  if (products.length === 0) return null;

  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock = products.filter(p => p.stock > 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-destructive/10 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div className="text-left">
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  {outOfStock.length > 0 && `${outOfStock.length} out of stock`}
                  {outOfStock.length > 0 && lowStock.length > 0 && ' · '}
                  {lowStock.length > 0 && `${lowStock.length} low stock`}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {products.length} product{products.length !== 1 ? 's' : ''} need attention
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-[10px] sm:text-xs h-5 sm:h-6">
                {products.length}
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-destructive/20 p-2 sm:p-3 space-y-1 sm:space-y-1.5 max-h-[300px] overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-destructive/5 transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-muted overflow-hidden">
                  {product.image_url ? (
                    <OptimizedImage src={product.image_url} alt={product.name} preset="thumbnail" width={36} height={36} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">৳{product.price.toLocaleString()}</p>
                </div>
                <Badge
                  variant={product.stock === 0 ? 'destructive' : 'secondary'}
                  className={cn(
                    'text-[10px] h-5 flex-shrink-0',
                    product.stock === 0
                      ? ''
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  )}
                >
                  {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => navigate('/admin/products')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
