import { Suspense, lazy, useEffect } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFocusManagement } from "@/hooks/useFocusManagement";
import OfflineIndicator from "@/components/OfflineIndicator";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { RequireAuth } from "@/components/auth/RequireAuth";

// Public pages
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const AcademyPage = lazy(() => import("./pages/AcademyPage"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrderPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminEnrollments = lazy(() => import("./pages/admin/AdminEnrollments"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminIncompleteOrders = lazy(() => import("./pages/admin/AdminIncompleteOrders"));
const AdminEcommerceCustomers = lazy(() => import("./pages/admin/AdminEcommerceCustomers"));
const AdminDeliveryZones = lazy(() => import("./pages/admin/AdminDeliveryZones"));
const AdminRecoveryAnalytics = lazy(() => import("./pages/admin/AdminRecoveryAnalytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
    },
  },
});

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useFocusManagement();
  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [pathname]);
  return null;
};

const PageLoader = () => (
  <>
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/20">
      <div className="h-full bg-primary rounded-r-full animate-progress-bar" />
    </div>
    <div className="min-h-[60vh]" />
  </>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return <div key={pathname} className="animate-page-enter">{children}</div>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider queryClient={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Sonner />
          <OfflineIndicator />
          <BrowserRouter>
            <ScrollToTop />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <PageTransition>
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />

                    {/* Shop */}
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
                    <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
                    <Route path="/track-order" element={<TrackOrderPage />} />

                    {/* Academy */}
                    <Route path="/academy" element={<AcademyPage />} />
                    <Route path="/course/:id" element={<CourseDetailPage />} />

                    {/* User dashboard */}
                    <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                    <Route path="/profile" element={<Navigate to="/dashboard" replace />} />

                    {/* Admin */}
                    <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
                    <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
                    <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
                    <Route path="/admin/ecommerce-customers" element={<RequireAdmin><AdminEcommerceCustomers /></RequireAdmin>} />
                    <Route path="/admin/coupons" element={<RequireAdmin><AdminCoupons /></RequireAdmin>} />
                    <Route path="/admin/delivery-zones" element={<RequireAdmin><AdminDeliveryZones /></RequireAdmin>} />
                    <Route path="/admin/incomplete-orders" element={<RequireAdmin><AdminIncompleteOrders /></RequireAdmin>} />
                    <Route path="/admin/recovery-analytics" element={<RequireAdmin><AdminRecoveryAnalytics /></RequireAdmin>} />
                    <Route path="/admin/courses" element={<RequireAdmin><AdminCourses /></RequireAdmin>} />
                    <Route path="/admin/enrollments" element={<RequireAdmin><AdminEnrollments /></RequireAdmin>} />
                    <Route path="/admin/customers" element={<RequireAdmin><AdminCustomers /></RequireAdmin>} />
                    <Route path="/admin/messages" element={<RequireAdmin><AdminContactMessages /></RequireAdmin>} />
                    <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
