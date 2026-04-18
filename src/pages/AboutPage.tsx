import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Users, Stethoscope, PawPrint, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const features = [
  {
    icon: <Building2 className="h-8 w-8" />,
    title: 'Verified Clinics',
    description: 'All veterinary clinics are thoroughly verified to ensure quality care for your pets.',
  },
  {
    icon: <Stethoscope className="h-8 w-8" />,
    title: 'Expert Doctors',
    description: 'Our platform connects you with certified veterinary professionals across specializations.',
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Trusted Platform',
    description: 'Secure booking system with transparent reviews and ratings from real pet owners.',
  },
  {
    icon: <Heart className="h-8 w-8" />,
    title: 'Pet Community',
    description: 'Join thousands of pet lovers sharing experiences and supporting each other.',
  },
];

const stats = [
  { value: '1000+', label: 'Happy Pet Parents' },
  { value: '50+', label: 'Verified Clinics' },
  { value: '100+', label: 'Expert Doctors' },
  { value: '5000+', label: 'Appointments Booked' },
];

const AboutPage = memo(() => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO
        title="About Us"
        description="VetMedix is Bangladesh's trusted pet healthcare platform connecting pet owners with verified veterinary clinics and expert doctors."
        canonicalUrl="https://vetmedix.lovable.app/about"
      />
      <Navbar />
      
      <main id="main-content" className="animate-page-enter">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <PawPrint className="h-4 w-4" />
                <span className="text-sm font-medium">Bangladesh's Pet Healthcare Platform</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-6">
                Making Pet Healthcare{' '}
                <span className="text-primary">Accessible</span> for Everyone
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                VetMedix is dedicated to connecting pet owners with trusted veterinary clinics 
                and doctors across Bangladesh. We believe every pet deserves quality healthcare.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/clinics">
                    Find a Clinic
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/doctors">Browse Doctors</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Why Choose VetMedix?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're building the most trusted platform for pet healthcare in Bangladesh.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-border/50 hover:shadow-lg transition-shadow">
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

        {/* Mission Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                To create a seamless connection between pet owners and quality veterinary 
                services. We strive to make pet healthcare more accessible, transparent, 
                and convenient for every pet family in Bangladesh.
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

      <Footer />
      <MobileNav />
    </div>
  );
});

AboutPage.displayName = 'AboutPage';

export default AboutPage;
