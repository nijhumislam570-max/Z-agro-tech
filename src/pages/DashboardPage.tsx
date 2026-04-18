import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, GraduationCap } from 'lucide-react';
import OrdersTab from '@/components/dashboard/OrdersTab';
import CoursesTab from '@/components/dashboard/CoursesTab';
import { BentoGrid } from '@/components/dashboard/BentoGrid';
import KPIMarqueeTile from '@/components/dashboard/tiles/KPIMarqueeTile';
import QuickActionsTile from '@/components/dashboard/tiles/QuickActionsTile';
import LearningPathTile from '@/components/dashboard/tiles/LearningPathTile';
import RecommendedInputsTile from '@/components/dashboard/tiles/RecommendedInputsTile';
import RecentOrderTile from '@/components/dashboard/tiles/RecentOrderTile';
import MasterclassTile from '@/components/dashboard/tiles/MasterclassTile';
import FeaturedCarouselTile from '@/components/dashboard/tiles/FeaturedCarouselTile';

const DashboardPage = () => {
  useDocumentTitle('Dashboard');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Dashboard — Z Agro Tech"
        description="Your personalized farm hub: orders, courses, and recommended agri-inputs."
        url="/dashboard"
      />
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* Hero with bento grid over agri gradient */}
        <section className="bg-agri-gradient relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(0_0%_100%/0.1),_transparent_60%)] pointer-events-none" />
          <div className="relative container mx-auto px-4 sm:px-6 py-8 md:py-10">
            <BentoGrid>
              <KPIMarqueeTile />
              <QuickActionsTile />
              <FeaturedCarouselTile />
              <LearningPathTile />
              <RecommendedInputsTile />
              <RecentOrderTile />
              <MasterclassTile />
            </BentoGrid>
          </div>
        </section>

        {/* Detailed tabs below */}
        <section className="container mx-auto px-4 sm:px-6 py-8 md:py-10">
          <header className="mb-5">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Your activity
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full history of your AgroShop orders and Academy enrollments.
            </p>
          </header>
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4" /> AgroShop Orders
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-2">
                <GraduationCap className="h-4 w-4" /> Academy Enrollments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="orders">
              <OrdersTab />
            </TabsContent>
            <TabsContent value="courses">
              <CoursesTab />
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
