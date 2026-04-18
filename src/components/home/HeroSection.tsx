import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Leaf, GraduationCap, ShoppingBag, Sprout } from 'lucide-react';

export const HeroSection = () => (
  <section className="relative overflow-hidden">
    <div
      className="absolute inset-0 bg-gradient-to-br from-[hsl(90,30%,96%)] via-[hsl(60,40%,97%)] to-[hsl(38,60%,95%)]"
      aria-hidden="true"
    />
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      <Sprout className="absolute top-[15%] left-[8%] h-8 w-8 text-primary/20 animate-float" />
      <Leaf className="absolute bottom-[20%] right-[12%] h-10 w-10 text-primary/15 animate-float" style={{ animationDelay: '1.5s' }} />
    </div>

    <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28 relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-page-enter">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/70 backdrop-blur-md border border-primary/15 text-sm font-medium text-foreground shadow-soft animate-fade-in"
          style={{ animationDelay: '60ms', animationFillMode: 'both' }}
        >
          <Sprout className="h-4 w-4 text-primary" />
          <span>Cultivating innovation in agriculture</span>
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground animate-slide-up"
          style={{ animationDelay: '120ms', animationFillMode: 'both' }}
        >
          Grow smarter with{' '}
          <span className="bg-gradient-to-r from-primary to-[hsl(142,45%,38%)] bg-clip-text text-transparent">
            Z Agro Tech
          </span>
        </h1>

        <p
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in"
          style={{ animationDelay: '220ms', animationFillMode: 'both' }}
        >
          Premium agriculture supplies and expert-led farming courses, all in one trusted platform built for modern farmers.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-3 justify-center pt-2 animate-fade-in"
          style={{ animationDelay: '320ms', animationFillMode: 'both' }}
        >
          <Link to="/shop">
            <Button size="lg" className="gap-2 rounded-full px-7 h-12 shadow-button">
              <ShoppingBag className="h-4 w-4" />
              Shop Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/academy">
            <Button size="lg" variant="outline" className="gap-2 rounded-full px-7 h-12 border-primary/30 hover:bg-primary/5">
              <GraduationCap className="h-4 w-4" />
              Browse Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
