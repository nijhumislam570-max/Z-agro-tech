import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, GraduationCap } from 'lucide-react';
import OrdersTab from '@/components/dashboard/OrdersTab';
import CoursesTab from '@/components/dashboard/CoursesTab';
import { useAuth } from '@/contexts/AuthContext';

const DashboardPage = () => {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Dashboard — Z Agro Tech" description="Your orders and courses in one place." url="/dashboard" />
      <Navbar />
      <main id="main-content" className="flex-1 container mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back{user?.email ? `, ${user.email}` : ''}.
          </p>
        </header>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" /> My Orders
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <GraduationCap className="h-4 w-4" /> My Courses
            </TabsTrigger>
          </TabsList>
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="courses">
            <CoursesTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
