import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, GraduationCap, ShoppingBag, Sprout, Users, Award, Smile } from 'lucide-react';
import heroImage from '@/assets/hero-agriculture-field.jpg';

const heroStats = [
  { icon: Users, value: '5,000+', label: 'Farmers' },
  { icon: GraduationCap, value: '40+', label: 'Courses' },
  { icon: Smile, value: '98%', label: 'Satisfaction' },
];

export const HeroSection = () => (
  <section className="relative overflow-hidden">
    {/* Background image with overlay */}
    <div className="absolute inset-0" aria-hidden="true">
      <img
        src={heroImage}
        alt=""
        width={1920}
        height={1088}
        className="w-full h-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/65" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>

    {/* Decorative blobs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
    </div>

    <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-page-enter">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-md border border-primary/20 text-sm font-medium text-foreground shadow-soft animate-fade-in"
          style={{ animationDelay: '60ms', animationFillMode: 'both' }}
        >
          <Sprout className="h-4 w-4 text-primary" />
          <span>Cultivating innovation in agriculture</span>
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight text-foreground animate-slide-up"
          style={{ animationDelay: '120ms', animationFillMode: 'both' }}
        >
          Grow smarter with{' '}
          <span className="bg-gradient-to-r from-primary to-[hsl(142,45%,38%)] bg-clip-text text-transparent">
            Z Agro Tech
          </span>
        </h1>

        <p
          className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in"
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
            <Button size="lg" variant="outline" className="gap-2 rounded-full px-7 h-12 border-primary/30 hover:bg-primary/5 bg-card/60 backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              Browse Courses
            </Button>
          </Link>
        </div>

        {/* Mini stat pills */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-6 animate-fade-in"
          style={{ animationDelay: '420ms', animationFillMode: 'both' }}
        >
          {heroStats.map((s) => (
            <div
              key={s.label}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/80 backdrop-blur-md border border-border/60 shadow-soft"
            >
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
