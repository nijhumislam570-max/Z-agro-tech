import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, GraduationCap, ShoppingBag, Truck, Leaf, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/SEO';

const features = [
  {
    icon: <Sprout className="h-8 w-8" />,
    title: 'Premium Agri-Inputs',
    description: 'Hand-picked seeds, fertilizers and crop-protection from trusted suppliers.',
  },
  {
    icon: <GraduationCap className="h-8 w-8" />,
    title: 'Expert-Led Courses',
    description: 'Learn smart farming, plant doctoring and organic techniques from certified agronomists.',
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: 'Quality Tested',
    description: 'Every product is sourced from verified suppliers with traceable supply chains.',
  },
  {
    icon: <Truck className="h-8 w-8" />,
    title: 'Nationwide Delivery',
    description: 'Fast shipping across Bangladesh with reliable courier partners and COD support.',
  },
];

const stats = [
  { value: '5K+', label: 'Active Farmers' },
  { value: '500+', label: 'Premium Products' },
  { value: '50+', label: 'Expert Courses' },
  { value: '64', label: 'Districts Served' },
];

const AboutPage = memo(() => {
  return (
    <>
      <SEO
        title="About Us"
        description="Z Agro Tech is Bangladesh's trusted hub for premium agriculture supplies and expert-led farming courses, built for modern farmers."
        canonicalUrl="https://zagrotech.lovable.app/about"
      />

      <main id="main-content" className="animate-page-enter">
        {/* Hero */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Leaf className="h-4 w-4" />
                <span className="text-sm font-medium">Cultivating innovation in agriculture</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-6">
                Helping farmers{' '}
                <span className="text-primary">grow smarter</span> across Bangladesh
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Z Agro Tech brings together a curated marketplace of premium agri-inputs and a learning
                academy taught by industry experts — everything a modern farmer needs in one trusted platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/shop">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop Products
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/academy">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Browse Courses
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">Why Choose Z Agro Tech?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built around the real needs of Bangladeshi farmers — quality, knowledge, and reliable delivery.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/50 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Sprout className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-8">
                To empower every farmer in Bangladesh with access to premium agri-inputs, expert knowledge,
                and a digital platform that makes modern, profitable farming simple and accessible.
              </p>
              <Button asChild>
                <Link to="/contact">
                  Get in Touch
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
});

AboutPage.displayName = 'AboutPage';

export default AboutPage;
