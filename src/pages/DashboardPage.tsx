import { memo, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, GraduationCap, Heart, User, Sparkles, Pencil, AlertTriangle } from 'lucide-react';
import OrdersTab from '@/components/dashboard/OrdersTab';
import CoursesTab from '@/components/dashboard/CoursesTab';
import WishlistTab from '@/components/dashboard/WishlistTab';
import ProfileTab from '@/components/dashboard/ProfileTab';
import EditProfileSheet from '@/components/dashboard/EditProfileSheet';
import { BentoGrid } from '@/components/dashboard/BentoGrid';
import { DashboardStatGrid } from '@/components/dashboard/DashboardStatGrid';
import { RecentOrdersList } from '@/components/dashboard/RecentOrdersList';
import { AlertsTile } from '@/components/dashboard/AlertsTile';
import QuickActionsTile from '@/components/dashboard/tiles/QuickActionsTile';
import LearningPathTile from '@/components/dashboard/tiles/LearningPathTile';
import RecommendedInputsTile from '@/components/dashboard/tiles/RecommendedInputsTile';
import MasterclassTile from '@/components/dashboard/tiles/MasterclassTile';
import FeaturedCarouselTile from '@/components/dashboard/tiles/FeaturedCarouselTile';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthUser } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

const VALID_TABS = ['orders', 'courses', 'wishlist', 'profile'] as const;
type TabValue = typeof VALID_TABS[number];

const Hero = memo(function Hero({ onEdit }: { onEdit: () => void }) {
  const user = useAuthUser();
  const { profile } = useProfile();

  const greetingName = useMemo(() => {
    const fullName = profile?.full_name?.trim();
    if (fullName) return fullName.split(' ')[0];
    return user?.email?.split('@')[0] ?? 'Farmer';
  }, [profile?.full_name, user?.email]);

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
    [],
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/90 backdrop-blur border border-primary/20 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-soft">
          <Sparkles className="h-3.5 w-3.5" />
          Your Farm Hub
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">
          Welcome back,{' '}
          <span className="bg-gradient-to-r from-primary to-[hsl(142,45%,40%)] bg-clip-text text-transparent">
            {greetingName}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 self-start sm:self-end text-sm text-foreground bg-card hover:bg-secondary border border-border hover:border-primary/40 rounded-lg px-3 py-2 shadow-soft transition-all min-h-[44px]"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit profile
      </button>
    </div>
  );
});

const DashboardPageInner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = (VALID_TABS as readonly string[]).includes(tabParam ?? '')
    ? (tabParam as TabValue)
    : 'orders';

  const { profile } = useProfile();
  const [editOpen, setEditOpen] = useState(false);

  const handleTabChange = useCallback((value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', value);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleEdit = useCallback(() => setEditOpen(true), []);

  return (
    <>
      <SEO
        title="Dashboard — Z Agro Tech"
        description="Your personalized farm hub: orders, courses, and recommended agri-inputs."
        url="/dashboard"
        noIndex
      />
      <main id="main-content" className="flex-1 animate-page-enter">
        <h1 className="sr-only">Your Z Agro Tech Dashboard</h1>

        {/* HERO + Stat Grid */}
        <section
          className="relative overflow-hidden bg-gradient-to-b from-secondary/50 via-background to-background"
          aria-labelledby="dashboard-hero-heading"
        >
          <h2 id="dashboard-hero-heading" className="sr-only">At-a-glance overview</h2>
          {/* Decorative background shapes — match Academy hero */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
          <div className="container mx-auto px-4 sm:px-6 py-6 md:py-10 relative z-10">
            <Hero onEdit={handleEdit} />
            <DashboardStatGrid />
          </div>
        </section>

        {/* BODY — Recent orders + Quick Actions/Alerts + Learning + Recommended + Featured */}
        <section className="bg-secondary/30 border-y border-border/60 pb-10 md:pb-14 pt-8 md:pt-10" aria-labelledby="dashboard-overview-heading">
          <div className="container mx-auto px-4 sm:px-6">
            <header className="mb-5 sm:mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">Overview</p>
              <h2 id="dashboard-overview-heading" className="text-xl sm:text-2xl font-display font-bold text-foreground">
                Your farm at a glance
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Recent orders, learning progress and curated picks — all in one place.
              </p>
            </header>
            <BentoGrid>
              <RecentOrdersList />
              <div className="col-span-1 lg:col-span-4 grid grid-cols-1 gap-4 md:gap-5">
                <QuickActionsTile />
                <AlertsTile />
              </div>
              <LearningPathTile />
              <RecommendedInputsTile />
              <MasterclassTile />
              <FeaturedCarouselTile />
            </BentoGrid>
          </div>
        </section>

        {/* DETAIL TABS */}
        <section className="container mx-auto px-4 sm:px-6 py-8 md:py-10">
          <header className="mb-5">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Your activity
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full history of your AgroShop orders and Academy enrollments.
            </p>
          </header>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 h-auto">
              <TabsTrigger value="orders" className="gap-2 min-h-[44px]">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-2 min-h-[44px]">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-2 min-h-[44px]">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Wishlist</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2 min-h-[44px]">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="orders"><OrdersTab /></TabsContent>
            <TabsContent value="courses"><CoursesTab /></TabsContent>
            <TabsContent value="wishlist"><WishlistTab /></TabsContent>
            <TabsContent value="profile"><ProfileTab /></TabsContent>
          </Tabs>
        </section>
      </main>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} profile={profile} />
    </>
  );
};

const DashboardErrorFallback = () => (
  <main id="main-content" className="flex-1 container mx-auto px-4 py-12">
    <Card className="max-w-md mx-auto border-destructive/30">
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard couldn't load</h2>
          <p className="text-sm text-muted-foreground mt-1">
            One of your tiles failed to render. Reload to try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 min-h-[44px]"
        >
          Reload Dashboard
        </button>
      </CardContent>
    </Card>
  </main>
);

const DashboardPage = () => (
  <ErrorBoundary fallback={<DashboardErrorFallback />}>
    <DashboardPageInner />
  </ErrorBoundary>
);

export default DashboardPage;
