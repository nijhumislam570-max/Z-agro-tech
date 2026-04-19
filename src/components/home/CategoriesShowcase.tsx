import { Link } from 'react-router-dom';
import { Sprout, Beef, FlaskConical, Wrench, ArrowRight } from 'lucide-react';

const categories = [
  {
    name: 'Crops & Seeds',
    slug: 'Crops',
    desc: 'Premium hybrid & local seed varieties',
    icon: Sprout,
    gradient: 'from-success/20 via-success/10 to-success-soft',
    iconBg: 'bg-success/15 text-success',
    barColor: 'bg-success',
    popularity: 92,
    n: '01',
  },
  {
    name: 'Livestock & Feed',
    slug: 'Livestock',
    desc: 'Quality feed and livestock essentials',
    icon: Beef,
    gradient: 'from-warning/20 via-warning/10 to-warning-soft',
    iconBg: 'bg-warning/15 text-warning',
    barColor: 'bg-warning',
    popularity: 78,
    n: '02',
  },
  {
    name: 'Fertilizer & Soil',
    slug: 'Fertilizer',
    desc: 'Organic & chemical nutrient blends',
    icon: FlaskConical,
    gradient: 'from-info/20 via-info/10 to-info-soft',
    iconBg: 'bg-info/15 text-info',
    barColor: 'bg-info',
    popularity: 85,
    n: '03',
  },
  {
    name: 'Tools & Equipment',
    slug: 'Equipment',
    desc: 'Modern farming tools and machinery',
    icon: Wrench,
    gradient: 'from-accent/20 via-accent/10 to-accent/5',
    iconBg: 'bg-accent/15 text-accent',
    barColor: 'bg-accent',
    popularity: 70,
    n: '04',
  },
];

export const CategoriesShowcase = () => (
  <section
    className="container mx-auto px-4 sm:px-6 py-12 sm:py-16"
    aria-labelledby="categories-heading"
  >
    <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-1.5">
          Shop by category
        </p>
        <h2
          id="categories-heading"
          className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground"
        >
          Everything for your farm
        </h2>
      </div>
      <Link
        to="/shop"
        className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse all <ArrowRight className="h-4 w-4" />
      </Link>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          to={`/shop?category=${encodeURIComponent(cat.slug)}`}
          className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${cat.gradient} p-4 sm:p-6 hover:shadow-soft hover:-translate-y-1 transition-all duration-300 min-h-[160px] sm:min-h-[200px] flex flex-col justify-between`}
          aria-label={`Browse ${cat.name}`}
        >
          {/* Number badge — circle */}
          <span
            aria-hidden="true"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm border border-border/60 flex items-center justify-center text-[11px] font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary/40 transition-colors"
          >
            {cat.n}
          </span>

          <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl ${cat.iconBg} flex items-center justify-center shadow-sm`}>
            <cat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-foreground mb-1 leading-tight">
              {cat.name}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">{cat.desc}</p>

            {/* Animated arrow line */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <span className="inline-block w-4 group-hover:w-7 h-px bg-primary transition-all duration-300" aria-hidden="true" />
              <span>Explore</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Decorative popularity bar */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-1 bg-background/40 overflow-hidden"
          >
            <div
              className={`h-full ${cat.barColor} opacity-70 transition-all duration-700 group-hover:opacity-100`}
              style={{ width: `${cat.popularity}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default CategoriesShowcase;
