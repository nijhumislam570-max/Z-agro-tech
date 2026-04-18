import { Suspense, lazy, useEffect, useCallback } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { PetProvider } from "@/contexts/PetContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFocusManagement } from "@/hooks/useFocusManagement";
import OfflineIndicator from "@/components/OfflineIndicator";
import SupportChatLoader from "@/components/SupportChatLoader";
import { RequireClinicOwner } from "@/components/clinic/RequireClinicOwner";
import { RequireDoctor } from "@/components/doctor/RequireDoctor";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { RequireAuth } from "@/components/auth/RequireAuth";

// ALL page routes lazy-loaded for minimal initial bundle
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ClinicsPage = lazy(() => import("./pages/ClinicsPage"));
const DoctorsPage = lazy(() => import("./pages/DoctorsPage"));

// Lazy load non-critical routes for better performance
const FeedPage = lazy(() => import("./pages/FeedPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const ClinicDetailPage = lazy(() => import("./pages/ClinicDetailPage"));
const BookAppointmentPage = lazy(() => import("./pages/BookAppointmentPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PetProfilePage = lazy(() => import("./pages/PetProfilePage"));
const CreatePetPage = lazy(() => import("./pages/CreatePetPage"));
const EditPetPage = lazy(() => import("./pages/EditPetPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrderPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const SelectRolePage = lazy(() => import("./pages/SelectRolePage"));
const DoctorDetailPage = lazy(() => import("./pages/DoctorDetailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

// Admin routes - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminClinics = lazy(() => import("./pages/admin/AdminClinics"));
const AdminSocial = lazy(() => import("./pages/admin/AdminSocial"));
const AdminDoctors = lazy(() => import("./pages/admin/AdminDoctors"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminIncompleteOrders = lazy(() => import("./pages/admin/AdminIncompleteOrders"));
const AdminRecoveryAnalytics = lazy(() => import("./pages/admin/AdminRecoveryAnalytics"));
const AdminEcommerceCustomers = lazy(() => import("./pages/admin/AdminEcommerceCustomers"));
const AdminDeliveryZones = lazy(() => import("./pages/admin/AdminDeliveryZones"));
const AdminCMS = lazy(() => import("./pages/admin/AdminCMS"));
const AdminCMSEditor = lazy(() => import("./pages/admin/AdminCMSEditor"));
const AdminSupportChat = lazy(() => import("./pages/admin/AdminSupportChat"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogArticlePage = lazy(() => import("./pages/BlogArticlePage"));

// Doctor routes - lazy loaded
const DoctorDashboard = lazy(() => import("./pages/doctor/DoctorDashboard"));
const DoctorProfile = lazy(() => import("./pages/doctor/DoctorProfile"));
const DoctorVerificationPage = lazy(() => import("./pages/doctor/DoctorVerificationPage"));

// Clinic owner routes - lazy loaded
const ClinicDashboard = lazy(() => import("./pages/clinic/ClinicDashboard"));
const ClinicProfile = lazy(() => import("./pages/clinic/ClinicProfile"));
const ClinicServices = lazy(() => import("./pages/clinic/ClinicServices"));
const ClinicDoctors = lazy(() => import("./pages/clinic/ClinicDoctors"));
const ClinicVerificationPage = lazy(() => import("./pages/clinic/ClinicVerificationPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes - reduce redundant refetches
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    },
  },
});

// Scroll restoration and focus management component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  // Focus management for accessibility
  useFocusManagement();
  
  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [pathname]);
  
  return null;
};

// Slim top progress bar (YouTube/GitHub style)
const PageLoader = () => (
  <>
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/20">
      <div className="h-full bg-primary rounded-r-full animate-progress-bar" />
    </div>
    <div className="min-h-[60vh]" />
  </>
);

// Page transition wrapper - CSS-only fade+slide animation on route change
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-page-enter">
      {children}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider queryClient={queryClient}>
      <CartProvider>
        <WishlistProvider>
          <PetProvider>
          <TooltipProvider>
            
            <Sonner />
            <OfflineIndicator />
            <BrowserRouter>
              <ScrollToTop />
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <PageTransition>
                  <Routes>
                    {/* All routes lazy-loaded */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<BlogArticlePage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/clinics" element={<ClinicsPage />} />
                     {/* Backward-compatible alias (some links use plural) */}
                     <Route path="/clinics/:id" element={<ClinicDetailPage />} />
                    <Route path="/doctors" element={<DoctorsPage />} />
                    <Route path="/doctor/:id" element={<DoctorDetailPage />} />
                    
                    {/* Auth-guarded social routes */}
                    <Route path="/feed" element={<RequireAuth><FeedPage /></RequireAuth>} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
                    <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                    <Route path="/chat/:conversationId" element={<RequireAuth><ChatPage /></RequireAuth>} />
                    <Route path="/pet/:id" element={<PetProfilePage />} />
                    <Route path="/pets/new" element={<RequireAuth><CreatePetPage /></RequireAuth>} />
                    <Route path="/pets/:id/edit" element={<RequireAuth><EditPetPage /></RequireAuth>} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                     <Route path="/clinic/:id" element={<ClinicDetailPage />} />
                    <Route path="/book-appointment/:clinicId" element={<RequireAuth><BookAppointmentPage /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/track-order" element={<TrackOrderPage />} />
                    
                    {/* Admin routes - centralized guard */}
                    <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
                    <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
                    <Route path="/admin/customers" element={<RequireAdmin><AdminCustomers /></RequireAdmin>} />
                    <Route path="/admin/clinics" element={<RequireAdmin><AdminClinics /></RequireAdmin>} />
                    <Route path="/admin/social" element={<RequireAdmin><AdminSocial /></RequireAdmin>} />
                    <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
                    <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
                    <Route path="/admin/doctors" element={<RequireAdmin><AdminDoctors /></RequireAdmin>} />
                    <Route path="/admin/messages" element={<RequireAdmin><AdminContactMessages /></RequireAdmin>} />
                    <Route path="/admin/coupons" element={<RequireAdmin><AdminCoupons /></RequireAdmin>} />
                    <Route path="/admin/incomplete-orders" element={<RequireAdmin><AdminIncompleteOrders /></RequireAdmin>} />
                    <Route path="/admin/recovery-analytics" element={<RequireAdmin><AdminRecoveryAnalytics /></RequireAdmin>} />
                    <Route path="/admin/ecommerce-customers" element={<RequireAdmin><AdminEcommerceCustomers /></RequireAdmin>} />
                    <Route path="/admin/delivery-zones" element={<RequireAdmin><AdminDeliveryZones /></RequireAdmin>} />
                    <Route path="/admin/cms" element={<RequireAdmin><AdminCMS /></RequireAdmin>} />
                    <Route path="/admin/cms/new" element={<RequireAdmin><AdminCMSEditor /></RequireAdmin>} />
                    <Route path="/admin/cms/:id/edit" element={<RequireAdmin><AdminCMSEditor /></RequireAdmin>} />
                    <Route path="/admin/support-chat" element={<RequireAdmin><AdminSupportChat /></RequireAdmin>} />
                    {/* OAuth Role Selection */}
                    <Route path="/select-role" element={<RequireAuth><SelectRolePage /></RequireAuth>} />
                    
                    {/* Doctor routes - guarded */}
                    <Route path="/doctor/dashboard" element={<RequireDoctor><DoctorDashboard /></RequireDoctor>} />
                    <Route path="/doctor/profile" element={<RequireDoctor><DoctorProfile /></RequireDoctor>} />
                    <Route path="/doctor/verification" element={<RequireDoctor><DoctorVerificationPage /></RequireDoctor>} />
                    
                    {/* Clinic owner routes - guarded */}
                    <Route path="/clinic/verification" element={<RequireClinicOwner><ClinicVerificationPage /></RequireClinicOwner>} />
                    <Route path="/clinic/dashboard" element={<RequireClinicOwner><ClinicDashboard /></RequireClinicOwner>} />
                    <Route path="/clinic/profile" element={<RequireClinicOwner><ClinicProfile /></RequireClinicOwner>} />
                    <Route path="/clinic/owner-profile" element={<Navigate to="/clinic/profile?tab=owner" replace />} />
                    <Route path="/clinic/services" element={<RequireClinicOwner><ClinicServices /></RequireClinicOwner>} />
                    <Route path="/clinic/doctors" element={<RequireClinicOwner><ClinicDoctors /></RequireClinicOwner>} />
                    
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </PageTransition>
                </Suspense>
              </ErrorBoundary>
              <SupportChatLoader />
            </BrowserRouter>
          </TooltipProvider>
          </PetProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
