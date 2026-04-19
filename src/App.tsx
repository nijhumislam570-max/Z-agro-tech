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
import { AdminShell } from "@/components/admin/AdminLayout";
import PublicShell from "@/components/PublicShell";

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
  <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/20">
    <div className="h-full bg-primary rounded-r-full animate-progress-bar" />
  </div>
);

// PageTransition removed: keying the entire <Routes /> tree by pathname was
// remounting persistent shells (admin sidebar/header, public navbar/footer)
// on every navigation. Animation is now applied per-shell to the inner content
// only — see AdminShell <main> and PublicShell <Outlet/> wrappers.

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
                <Routes>
                    {/* Auth pages — full-bleed, no public shell */}
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Public — persistent shell (Navbar + Footer + MobileNav stay mounted) */}
                    <Route element={<PublicShell />}>
                      <Route path="/" element={<Index />} />
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

                      <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Admin — single persistent shell, child pages render via <Outlet /> */}
                    <Route path="/admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="ecommerce-customers" element={<AdminEcommerceCustomers />} />
                      <Route path="coupons" element={<AdminCoupons />} />
                      <Route path="delivery-zones" element={<AdminDeliveryZones />} />
                      <Route path="incomplete-orders" element={<AdminIncompleteOrders />} />
                      <Route path="recovery-analytics" element={<AdminRecoveryAnalytics />} />
                      <Route path="courses" element={<AdminCourses />} />
                      <Route path="enrollments" element={<AdminEnrollments />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="messages" element={<AdminContactMessages />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
