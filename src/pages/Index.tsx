import SEO from '@/components/SEO';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import HeroSection from '@/components/home/HeroSection';
import PartnersStrip from '@/components/home/PartnersStrip';
import FeaturedProductsGrid from '@/components/home/FeaturedProductsGrid';
import CategoriesShowcase from '@/components/home/CategoriesShowcase';
import FeaturedCoursesGrid from '@/components/home/FeaturedCoursesGrid';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import TrustStatsStrip from '@/components/home/TrustStatsStrip';
import NewsletterCTA from '@/components/home/NewsletterCTA';
import FAQTeaser from '@/components/home/FAQTeaser';
import { Card, CardContent } from '@/components/ui/card';
import { Sprout, ShieldCheck, Truck, Leaf, GraduationCap, HeartHandshake } from 'lucide-react';

const valueProps = [
  {
    icon: Sprout,
    title: 'Premium quality',
    desc: 'Hand-picked seeds, fertilizers & tools you can trust season after season.',
    accent: 'from-success/15 to-success-soft',
    iconBg: 'bg-success/15 text-success',
    span: 'sm:col-span-2 lg:col-span-2',
  },
  {
    icon: ShieldCheck,
    title: 'Verified experts',
    desc: 'Courses by certified agronomists.',
    accent: 'from-info/15 to-info-soft',
    iconBg: 'bg-info/15 text-info',
    span: '',
  },
  {
    icon: Truck,
    title: 'Fast delivery',
    desc: 'Reliable shipping across all 8 divisions.',
    accent: 'from-warning/15 to-warning-soft',
    iconBg: 'bg-warning/15 text-warning',
    span: '',
  },
  {
    icon: Leaf,
    title: 'Sustainable practices',
    desc: 'Organic options for healthier soil.',
    accent: 'from-success/15 to-success-soft',
    iconBg: 'bg-success/15 text-success',
    span: '',
  },
  {
    icon: GraduationCap,
    title: 'Learn anytime',
    desc: 'Self-paced courses on your schedule.',
    accent: 'from-accent/15 to-accent/5',
    iconBg: 'bg-accent/15 text-accent',
    span: '',
  },
  {
    icon: HeartHandshake,
    title: 'Farmer-first support',
    desc: 'Real humans, real answers — dedicated 24/7 farmer helpline in Bangla and English.',
    accent: 'from-primary/15 to-primary/5',
    iconBg: 'bg-primary/15 text-primary',
    span: 'sm:col-span-2 lg:col-span-2',
  },
];

const Index = () => {
  useDocumentTitle('Home');

  return (
    <>
      <SEO
        title="Z Agro Tech — Premium Agriculture Supplies & Expert Courses"
        description="Shop premium agriculture products and learn from expert-led farming courses on Z Agro Tech — Bangladesh's trusted agritech platform."
        url="https://zagrotech.lovable.app/"
        canonicalUrl="https://zagrotech.lovable.app/"
        schema={{
          type: 'Organization',
          name: 'Z Agro Tech',
          url: 'https://zagrotech.lovable.app',
          logo: 'https://zagrotech.lovable.app/favicon.jpg',
          description: 'Bangladesh\'s trusted platform for premium agriculture supplies and expert-led farming courses.',
          sameAs: [],
        }}
      />
      <main id="main-content" className="flex-1 animate-page-enter">
        <HeroSection />
        <PartnersStrip />

        {/* Value props bento */}
        <section
          className="container mx-auto px-4 sm:px-6 py-12 sm:py-16"
          aria-labelledby="value-props-heading"
        >
          <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              Why choose us
            </p>
            <h2
              id="value-props-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3"
            >
              Built for the modern Bangladesh farmer
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Quality products, expert knowledge, and reliable support — everything you need in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {valueProps.map((v) => (
              <Card
                key={v.title}
                className={`border-border/60 bg-gradient-to-br ${v.accent} hover:border-primary/30 hover:shadow-soft hover:-translate-y-1 transition-all ${v.span}`}
              >
                <CardContent className="p-6 flex items-start gap-4 h-full">
                  <div className={`h-12 w-12 rounded-xl ${v.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <v.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-1">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <FeaturedProductsGrid />
        <CategoriesShowcase />
        <FeaturedCoursesGrid />
        <HowItWorks />
        <Testimonials />
        <TrustStatsStrip />
        <NewsletterCTA />
        <FAQTeaser />
      </main>
    </>
  );
};

export default Index;
