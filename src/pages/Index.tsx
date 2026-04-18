import { memo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { 
  Users, PawPrint, 
  ArrowRight, Sparkles, Heart, Camera, MessageCircle, 
  Star, TrendingUp, Share2
} from 'lucide-react';
import heroCatSocial from '@/assets/hero-cat-social.png';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import SEO from '@/components/SEO';

// Below-fold content lazy loaded - social feed, stories, sidebar, featured products
const BelowFoldContent = lazy(() => import('@/components/home/BelowFoldContent'));

// Memoized feature cards to prevent unnecessary re-renders
const FeatureCard = memo(({ icon: Icon, label, color, iconColor }: { 
  icon: typeof Camera; 
  label: string; 
  color: string; 
  iconColor: string;
}) => (
  <div 
    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default group"
    role="listitem"
  >
    <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor}`} aria-hidden="true" />
    </div>
    <span className="text-[11px] sm:text-xs font-semibold text-foreground/80">{label}</span>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

// Social features data - static, no need to recreate on each render
const socialFeatures = [
  { icon: Camera, label: 'Share Photos', color: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
  { icon: Heart, label: 'Get Likes', color: 'from-rose-500/20 to-rose-500/5', iconColor: 'text-rose-500' },
  { icon: MessageCircle, label: 'Connect', color: 'from-accent/20 to-accent/5', iconColor: 'text-accent' },
] as const;

// Highlight features data
const highlightFeatures = [
  { icon: Camera, title: 'Pet Profiles', desc: 'Create cute profiles', color: 'bg-primary/10', iconColor: 'text-primary' },
  { icon: Share2, title: 'Share Stories', desc: '24hr pet moments', color: 'bg-accent/10', iconColor: 'text-accent' },
  { icon: TrendingUp, title: 'Go Viral', desc: 'Get featured', color: 'bg-lavender/10', iconColor: 'text-lavender' },
  { icon: Star, title: 'Pet Stars', desc: 'Follow favorites', color: 'bg-sunshine/10', iconColor: 'text-sunshine' },
] as const;

// Lightweight loader for below-fold content
const BelowFoldLoader = () => (
  <div className="container mx-auto px-4 sm:px-6 py-8">
    <div className="space-y-4">
      <div className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
      <div className="h-64 bg-muted/50 rounded-2xl animate-pulse" />
    </div>
  </div>
);

const Index = () => {
  useDocumentTitle('Home');
  
  const organizationSchema = {
    type: 'Organization' as const,
    name: 'VetMedix',
    url: 'https://vetmedix.lovable.app',
    logo: 'https://vetmedix.lovable.app/og-image.png',
    description: "Bangladesh's premier pet care platform. Connect with pet parents, book vet appointments, and shop premium pet supplies.",
    sameAs: ['https://facebook.com/vetmedix', 'https://instagram.com/vetmedix'],
  };
  const { user } = useAuth();
  const { pets } = usePets();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO 
        title="Pet Care, Social Network & Veterinary Services"
        description="VetMedix is Bangladesh's premier pet care platform. Create pet profiles, share moments, shop premium pet supplies, and book veterinary appointments."
        url="https://vetmedix.lovable.app"
        schema={organizationSchema}
      />
      <Navbar />
      
      <main id="main-content">
        {/* Hero Section - Above the fold, renders immediately */}
        <section 
          className="relative overflow-hidden min-h-[85vh] sm:min-h-[90vh]"
          aria-labelledby="hero-heading"
        >
          {/* Animated gradient background */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-[hsl(35,60%,96%)] via-[hsl(15,65%,96%)] to-[hsl(200,55%,96%)] animate-gradient-slow will-change-auto"
            aria-hidden="true"
          />
          
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-16 -right-16 w-32 h-32 sm:w-56 sm:h-56 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-primary/15 to-accent/10 blur-3xl animate-pulse-slow transform-gpu" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 sm:w-64 sm:h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-tr from-accent/12 to-lavender/10 blur-3xl animate-pulse-slow transform-gpu" style={{ animationDelay: '2s' }} />
            
            <div className="absolute top-[8%] left-[5%] text-xl sm:text-3xl lg:text-4xl opacity-10 animate-float rotate-[-15deg]">🐾</div>
            <div className="absolute top-[12%] right-[8%] text-lg sm:text-2xl opacity-8 animate-float rotate-[10deg]" style={{ animationDelay: '2s' }}>🐾</div>
            <div className="absolute bottom-[20%] left-[3%] text-lg sm:text-2xl opacity-8 animate-float rotate-[20deg] hidden sm:block" style={{ animationDelay: '1s' }}>🐾</div>
            <div className="absolute bottom-[25%] right-[5%] text-base sm:text-xl opacity-8 animate-float rotate-[-20deg] hidden md:block" style={{ animationDelay: '3s' }}>🐾</div>
            
            <div className="absolute top-[22%] right-[18%] hidden lg:block">
              <Heart className="h-5 w-5 text-rose-400/30 fill-rose-400/30 animate-bounce-gentle" />
            </div>
            <div className="absolute bottom-[40%] right-[12%] hidden xl:block">
              <Heart className="h-4 w-4 text-primary/25 fill-primary/25 animate-bounce-gentle" style={{ animationDelay: '1s' }} />
            </div>
            
            <div className="absolute top-[28%] left-[22%] hidden xl:block">
              <Sparkles className="h-4 w-4 text-sunshine/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="absolute top-[48%] right-[15%] hidden xl:block">
              <Star className="h-3.5 w-3.5 text-sunshine/35 fill-sunshine/35 animate-pulse" style={{ animationDelay: '0.8s' }} />
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 relative z-10 h-full flex items-center">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center w-full">
              {/* Content */}
              <div className="space-y-5 sm:space-y-6 lg:space-y-7 order-2 lg:order-1 text-center lg:text-left animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/85 backdrop-blur-sm border border-primary/15 text-foreground text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-default">
                  <div className="relative flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-accent rounded-full animate-ping" />
                  </div>
                  <span className="whitespace-nowrap">10,000+ Pet Parents</span>
                  <Sparkles className="h-3.5 w-3.5 text-sunshine flex-shrink-0" />
                </div>
                
                <h1 
                  id="hero-heading"
                  className="text-3xl leading-[1.15] sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl font-display font-bold tracking-tight"
                >
                  <span className="text-foreground block">VETMEDIX</span>
                  <span className="block mt-1.5 sm:mt-2">
                    <span className="bg-gradient-to-r from-primary via-accent to-lavender bg-clip-text text-transparent">One Stop Pet Care</span>
                  </span>
                  <span className="block mt-0.5">
                    <span className="text-gradient-fun">Community</span>
                  </span>
                </h1>
                
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Your complete destination for pet care — connect with other pet parents, book vet appointments, shop essentials, and share precious moments! 🐾
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 justify-center lg:justify-start">
                  {user && pets.length === 0 ? (
                    <Link to="/pets/new" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-13 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" />
                        Add Your First Pet
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : !user ? (
                    <Link to="/auth" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-13 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" />
                        JOIN THE COMMUNITY
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/feed" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-13 font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" />
                        GO TO FEED
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </div>

                <div 
                  className="flex flex-wrap gap-2.5 sm:gap-3 pt-3 justify-center lg:justify-start"
                  role="list"
                  aria-label="Platform features"
                >
                  {socialFeatures.map((feature) => (
                    <FeatureCard
                      key={feature.label}
                      icon={feature.icon}
                      label={feature.label}
                      color={feature.color}
                      iconColor={feature.iconColor}
                    />
                  ))}
                </div>
              </div>

              {/* Hero Illustration */}
              <div className="relative order-1 lg:order-2 flex justify-center items-center py-6 sm:py-8 lg:py-0">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[340px] md:h-[340px] lg:w-[400px] lg:h-[400px] rounded-full bg-gradient-to-br from-primary/8 via-accent/5 to-lavender/8 blur-2xl animate-pulse-slow" />
                  </div>
                  
                  <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-6 lg:-left-10 z-10">
                    <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-lg sm:text-2xl animate-float ring-3 ring-white/60">
                      🐕
                    </div>
                  </div>
                  <div className="absolute top-2 -right-2 sm:top-0 sm:-right-4 lg:-right-8 z-10">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-base sm:text-xl animate-float ring-3 ring-white/60" style={{ animationDelay: '0.5s' }}>
                      🐰
                    </div>
                  </div>
                  <div className="absolute bottom-14 -right-3 sm:bottom-16 sm:-right-6 lg:-right-12 z-10">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-lg flex items-center justify-center text-base sm:text-lg animate-float ring-3 ring-white/60" style={{ animationDelay: '1s' }}>
                      🐦
                    </div>
                  </div>
                  <div className="absolute bottom-4 -left-2 sm:bottom-6 sm:-left-5 lg:-left-10 z-10">
                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white shadow-lg flex items-center justify-center text-sm sm:text-lg animate-float ring-3 ring-white/60" style={{ animationDelay: '1.5s' }}>
                      🐹
                    </div>
                  </div>
                  
                  <div className="absolute top-1/2 -right-4 sm:-right-8 lg:-right-14 z-10 hidden sm:block">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-lg flex items-center justify-center text-base sm:text-lg animate-float ring-3 ring-white/60" style={{ animationDelay: '2s' }}>
                      🐱
                    </div>
                  </div>

                  <div className="absolute top-[20%] right-0 sm:right-2 lg:right-4 z-20">
                    <div className="bg-white rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg flex items-center gap-1.5 animate-bounce-gentle border border-rose-100">
                      <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 fill-rose-500 animate-pulse" />
                      <span className="text-xs sm:text-sm font-bold text-foreground">+99</span>
                    </div>
                  </div>
                  
                  <div className="absolute top-[45%] -left-2 sm:-left-6 lg:-left-10 z-20 hidden sm:block">
                    <div className="bg-white rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg flex items-center gap-1.5 animate-bounce-gentle border border-accent/20" style={{ animationDelay: '1s' }}>
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                      <span className="text-xs sm:text-sm font-bold text-foreground">New!</span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/12 to-transparent rounded-full blur-2xl scale-90" />
                    <img
                      src={heroCatSocial}
                      alt="Cute cat using VetMedix social app on smartphone, representing pet social media community"
                      width={400}
                      height={400}
                      fetchPriority="high"
                      decoding="async"
                      className="relative w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] lg:w-[380px] lg:h-[380px] object-contain drop-shadow-2xl"
                    />
                  </div>

                  <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 shadow-xl border border-primary/10">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-center">
                          <p className="text-lg sm:text-xl font-bold text-foreground">5K+</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Profiles</p>
                        </div>
                        <div className="h-7 sm:h-8 w-px bg-foreground/10" />
                        <div className="text-center">
                          <p className="text-lg sm:text-xl font-bold text-foreground">20K+</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Posts</p>
                        </div>
                        <div className="h-7 sm:h-8 w-px bg-foreground/10 hidden sm:block" />
                        <div className="text-center hidden sm:block">
                          <p className="text-base sm:text-xl font-bold text-foreground">50K+</p>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">Pets</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-20 overflow-hidden" aria-hidden="true">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full" role="presentation">
              <path 
                d="M0,60 C300,100 400,20 600,60 C800,100 900,20 1200,60 L1200,120 L0,120 Z" 
                className="fill-white"
              />
            </svg>
          </div>
        </section>

        {/* Social Features Highlight */}
        <section className="py-8 sm:py-12 bg-white border-y border-border/50" aria-labelledby="features-heading">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-8">
              <h2 id="features-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                Everything Your Pet Needs 
                <span className="text-gradient ml-1" aria-hidden="true">🐕</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">Social media + Pet care in one pawfect app</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" role="list">
              {highlightFeatures.map((feature) => (
                <div 
                  key={feature.title}
                  className={`${feature.color} rounded-2xl p-4 sm:p-5 text-center hover:scale-[1.02] transition-transform cursor-pointer active:scale-[0.98] transform-gpu`}
                  role="listitem"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.iconColor}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground mb-0.5 sm:mb-1">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Below-fold content: stories, feed, sidebar, featured products - lazy loaded */}
        <Suspense fallback={<BelowFoldLoader />}>
          <BelowFoldContent />
        </Suspense>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Index;
