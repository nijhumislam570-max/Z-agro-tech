import { ArrowRight, Scissors, Bone, Shirt, Zap, UtensilsCrossed, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const categories = [
  { icon: Scissors, label: 'Grooming', type: 'Grooming', color: 'bg-primary/10 text-primary' },
  { icon: Bone, label: 'Toys', type: 'Toys', color: 'bg-accent/10 text-accent' },
  { icon: Shirt, label: 'Clothing', type: 'Clothing', color: 'bg-primary/10 text-primary' },
  { icon: Zap, label: 'Electronics', type: 'Electronics', color: 'bg-accent/10 text-accent' },
  { icon: UtensilsCrossed, label: 'Feeding', type: 'Feeding', color: 'bg-primary/10 text-primary' },
  { icon: PawPrint, label: 'Accessories', type: 'Accessories', color: 'bg-accent/10 text-accent' },
];

const CategorySection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
            Find everything your pets need — from grooming essentials to fun toys and accessories
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-8">
          {categories.map((cat) => (
            <Link
              key={cat.type}
              to={`/shop?type=${cat.type}`}
              className="group flex flex-col items-center p-4 sm:p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-hover transition-all duration-300 text-center"
            >
              <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-2xl ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform mb-2 sm:mb-4`}>
                <cat.icon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h4 className="font-semibold text-foreground text-xs sm:text-sm">{cat.label}</h4>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link to="/shop">
              View All Products
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
