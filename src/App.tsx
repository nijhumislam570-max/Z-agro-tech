import { lazy, useEffect } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { STALE_2MIN, GC_10MIN } from "@/lib/queryConstants";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import SentryScopeSync from "@/components/SentryScopeSync";
import { useFocusManagement } from "@/hooks/useFocusManagement";
import OfflineIndicator from "@/components/OfflineIndicator";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminShell } from "@/components/admin/AdminLayout";
import AdminNotFound from "@/components/admin/AdminNotFound";
import PublicShell from "@/components/PublicShell";
import ProfileRedirect from "@/components/ProfileRedirect";
import RouteProgress from "@/components/RouteProgress";

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
      staleTime: STALE_2MIN,
      gcTime: GC_10MIN,
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

// Audit P1: Removed outer <Suspense fallback={<PageLoader />}>. The shell-level
// fallbacks (PublicPageSkeleton / AdminPageSkeleton) cover all post-auth chunk
// loads, and RouteProgress provides the top-of-viewport feedback during
// navigation. The outer fallback was producing a duplicate progress bar on
// cold lazy chunk loads.

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="zagrotech-theme" disableTransitionOnChange>
      <AuthProvider queryClient={queryClient}>
        <CartProvider>
          <TooltipProvider>
            <Sonner />
            <OfflineIndicator />
            <BrowserRouter>
              <SentryScopeSync />
              <ScrollToTop />
              <RouteProgress />
              <ErrorBoundary>
                <Routes>
                  {/* Auth pages — full-bleed, no public shell */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Legacy alias — hoisted above PublicShell so the redirect
                      runs before Navbar/Footer paint on a cold deep-link
                      load. Preserves search/hash. */}
                  <Route path="/profile" element={<ProfileRedirect />} />

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
                    {/* Admin catch-all — typos render a styled 404 inside the
                        admin chrome instead of a blank <Outlet />. */}
                    <Route path="*" element={<AdminNotFound />} />
                  </Route>
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
