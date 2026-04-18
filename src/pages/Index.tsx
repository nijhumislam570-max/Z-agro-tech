import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProductsGrid from '@/components/home/FeaturedProductsGrid';
import FeaturedCoursesGrid from '@/components/home/FeaturedCoursesGrid';
import TrustStatsStrip from '@/components/home/TrustStatsStrip';
import { Card, CardContent } from '@/components/ui/card';
import { Sprout, ShieldCheck, Truck } from 'lucide-react';

const valueProps = [
  { icon: Sprout, title: 'Premium quality', desc: 'Hand-picked seeds, fertilizers & tools you can trust.' },
  { icon: ShieldCheck, title: 'Verified experts', desc: 'Courses taught by certified agronomists and farmers.' },
  { icon: Truck, title: 'Fast delivery', desc: 'Reliable shipping across Bangladesh.' },
];

const Index = () => {
  useDocumentTitle('Home');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Z Agro Tech — Premium Agriculture Supplies & Expert Courses"
        description="Shop premium agriculture products and learn from expert-led farming courses on Z Agro Tech."
        url="/"
      />
      <Navbar />
      <main id="main-content" className="flex-1 @container">
        <HeroSection />

        {/* Value props bento */}
        <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 @container">
          <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
            {valueProps.map((v) => (
              <Card key={v.title} className="border-border/60 hover:border-primary/30 hover:shadow-soft transition-all">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <v.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{v.title}</h3>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <FeaturedProductsGrid />
        <FeaturedCoursesGrid />
        <TrustStatsStrip />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
