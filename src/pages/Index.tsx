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
        url="/"
        canonicalUrl="/"
        schema={{
          type: 'Organization',
          name: 'Z Agro Tech',
          url: '/',
          logo: '/favicon.png',
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
            {valueProps.map((v) => {
              const isLarge = v.span.includes('col-span-2');
              return (
                <Card
                  key={v.title}
                  className={`relative overflow-hidden border-border/60 bg-gradient-to-br ${v.accent} hover:border-primary/30 hover:shadow-soft hover:-translate-y-1 transition-all ${v.span}`}
                >
                  {/* Dotted texture overlay on large cards */}
                  {isLarge && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-40 pointer-events-none"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle, hsl(var(--foreground) / 0.06) 1px, transparent 1px)',
                        backgroundSize: '14px 14px',
                      }}
                    />
                  )}

                  {/* Corner accent — small circle on large cards */}
                  {isLarge && (
                    <span
                      aria-hidden="true"
                      className="absolute top-3 left-3 h-2 w-2 rounded-full bg-primary/40"
                    />
                  )}

                  {/* "Featured" pill on large cards */}
                  {isLarge && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Featured
                    </span>
                  )}

                  <CardContent className="relative p-6 flex items-start gap-4 h-full">
                    {/* Hexagon icon for large cards, rounded square for small */}
                    {isLarge ? (
                      <div
                        className={`h-14 w-14 ${v.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}
                        style={{
                          clipPath:
                            'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
                        }}
                      >
                        <v.icon className="h-6 w-6" />
                      </div>
                    ) : (
                      <div
                        className={`h-12 w-12 rounded-xl ${v.iconBg} flex items-center justify-center flex-shrink-0`}
                      >
                        <v.icon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-foreground mb-1">{v.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Below-the-fold sections — `content-visibility: auto` lets the
            browser skip layout/paint until the section nears the viewport.
            We hint a min-height per section so the scrollbar doesn't jitter
            as off-screen sections are skipped. */}
        <FeaturedProductsGrid />
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }}>
          <CategoriesShowcase />
        </div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 900px' }}>
          <FeaturedCoursesGrid />
        </div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}>
          <HowItWorks />
        </div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}>
          <Testimonials />
        </div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 600px' }}>
          <TrustStatsStrip />
        </div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 500px' }}>
          <NewsletterCTA />
        </div>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}>
          <FAQTeaser />
        </div>
      </main>
    </>
  );
};

export default Index;
