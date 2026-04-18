import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, ShoppingBag, Building2, Stethoscope, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ClinicCard from '@/components/ClinicCard';
import DoctorCard from '@/components/DoctorCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { ProductGridSkeleton } from '@/components/shop/ProductCardSkeleton';
import type { FavoriteClinicRow, FavoriteDoctorRow } from '@/types/database';

interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  discount: number | null;
  stock: number | null;
}

const WishlistPage = () => {
  useDocumentTitle('My Wishlist');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { wishlistIds, loading: wishlistLoading, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [favoriteClinics, setFavoriteClinics] = useState<FavoriteClinicRow[]>([]);
  const [favoriteDoctors, setFavoriteDoctors] = useState<FavoriteDoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  // Note: WishlistPage is NOT wrapped in RequireAuth in App.tsx
  // Keep auth redirect for unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch wishlist products via join: wishlists -> products (RLS: auth.uid() = user_id)
  useEffect(() => {
    if (!user || wishlistLoading) return;
    const ids = Array.from(wishlistIds);
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('wishlists')
          .select('product_id, product:products(id, name, price, category, image_url, badge, discount, stock)')
          .eq('user_id', user.id);
        if (data) {
          const mapped = data
            .map((row: any) => row.product)
            .filter(Boolean) as WishlistProduct[];
          setProducts(mapped);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user, wishlistIds, wishlistLoading]);

  // Optimistic: filter out products no longer in wishlistIds
  const visibleProducts = useMemo(
    () => products.filter(p => wishlistIds.has(p.id)),
    [products, wishlistIds]
  );

  // Fetch favorite clinics
  const fetchFavoriteClinics = useCallback(async () => {
    if (!user) return;
    setClinicsLoading(true);
    try {
      const { data } = await supabase
        .from('clinic_favorites')
        .select('id, clinic_id, clinic:clinics(id, name, rating, distance, services, image_url, is_open, is_verified)')
        .eq('user_id', user.id);
      if (data) setFavoriteClinics(data as unknown as FavoriteClinicRow[]);
    } catch {
      // silently fail
    } finally {
      setClinicsLoading(false);
    }
  }, [user]);

  // Fetch favorite doctors
  const fetchFavoriteDoctors = useCallback(async () => {
    if (!user) return;
    setDoctorsLoading(true);
    try {
      const { data } = await supabase
        .from('doctor_favorites')
        .select('id, doctor_id, doctor:doctors(id, name, specialization, qualifications, experience_years, consultation_fee, is_available, is_verified, avatar_url)')
        .eq('user_id', user.id);
      if (data) setFavoriteDoctors(data as unknown as FavoriteDoctorRow[]);
    } catch {
      // silently fail
    } finally {
      setDoctorsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavoriteClinics();
      fetchFavoriteDoctors();
    }
  }, [user, fetchFavoriteClinics, fetchFavoriteDoctors]);

  const removeClinicFavorite = async (favoriteId: string) => {
    try {
      await supabase.from('clinic_favorites').delete().eq('id', favoriteId);
      setFavoriteClinics(prev => prev.filter(f => f.id !== favoriteId));
      toast.success('Clinic removed from favorites.');
    } catch {
      toast.error('Failed to remove clinic.');
    }
  };

  const removeDoctorFavorite = async (favoriteId: string) => {
    try {
      await supabase.from('doctor_favorites').delete().eq('id', favoriteId);
      setFavoriteDoctors(prev => prev.filter(f => f.id !== favoriteId));
      toast.success('Doctor removed from favorites.');
    } catch {
      toast.error('Failed to remove doctor.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSaved = visibleProducts.length + favoriteClinics.length + favoriteDoctors.length;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Heart className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Wishlist</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{totalSaved} saved items</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="w-full bg-background border border-border/50 rounded-xl p-1 h-auto grid grid-cols-3 gap-1">
            <TabsTrigger
              value="products"
              className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Products</span>
              {visibleProducts.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-background/20 px-1.5 py-0.5 rounded-full">{visibleProducts.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="clinics"
              className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Clinics</span>
              {favoriteClinics.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-background/20 px-1.5 py-0.5 rounded-full">{favoriteClinics.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="doctors"
              className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Doctors</span>
              {favoriteDoctors.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-background/20 px-1.5 py-0.5 rounded-full">{favoriteDoctors.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            {loading || wishlistLoading ? (
              <ProductGridSkeleton count={8} />
            ) : visibleProducts.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="h-10 w-10 text-muted-foreground/40" />}
                title="No saved products"
                description="Browse the shop and tap the heart icon to save products you love"
                actionLabel="Browse Products"
                onAction={() => navigate('/shop')}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    category={product.category}
                    image={product.image_url || ''}
                    badge={product.badge}
                    discount={product.discount}
                    stock={product.stock}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Clinics Tab */}
          <TabsContent value="clinics">
            {clinicsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : favoriteClinics.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-10 w-10 text-muted-foreground/40" />}
                title="No saved clinics"
                description="Browse clinics and save your favorites for quick access"
                actionLabel="Find Clinics"
                onAction={() => navigate('/clinics')}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {favoriteClinics.map((fav) => (
                  <div key={fav.id} className="relative">
                    <ClinicCard
                      id={fav.clinic?.id}
                      name={fav.clinic?.name || 'Unknown Clinic'}
                      rating={fav.clinic?.rating || 4.5}
                      distance={fav.clinic?.distance || '—'}
                      services={fav.clinic?.services || []}
                      image={fav.clinic?.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=400&fit=crop'}
                      isOpen={fav.clinic?.is_open ?? true}
                      isVerified={fav.clinic?.is_verified ?? false}
                      onBook={() => navigate(`/book-appointment/${fav.clinic_id}`)}
                      onViewDetails={() => navigate(`/clinic/${fav.clinic_id}`)}
                    />
                    <button
                      onClick={() => removeClinicFavorite(fav.id)}
                      className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground flex items-center justify-center shadow-md transition-all active:scale-95"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors">
            {doctorsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : favoriteDoctors.length === 0 ? (
              <EmptyState
                icon={<Stethoscope className="h-10 w-10 text-muted-foreground/40" />}
                title="No saved doctors"
                description="Browse doctors and save your favorites for quick booking"
                actionLabel="Find Doctors"
                onAction={() => navigate('/doctors')}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteDoctors.map((fav) => (
                  <div key={fav.id} className="relative">
                    <DoctorCard
                      id={fav.doctor?.id || fav.doctor_id}
                      name={fav.doctor?.name || 'Unknown Doctor'}
                      specialization={fav.doctor?.specialization || null}
                      qualifications={fav.doctor?.qualifications || null}
                      experience_years={fav.doctor?.experience_years || null}
                      consultation_fee={fav.doctor?.consultation_fee || null}
                      is_available={fav.doctor?.is_available ?? true}
                      is_verified={fav.doctor?.is_verified ?? false}
                      avatar_url={fav.doctor?.avatar_url || null}
                      clinic_id=""
                      clinic_name="View Profile"
                      clinic_address={null}
                      clinic_is_verified={false}
                    />
                    <button
                      onClick={() => removeDoctorFavorite(fav.id)}
                      className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground flex items-center justify-center shadow-md transition-all active:scale-95"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

// Reusable empty state component
const EmptyState = ({ icon, title, description, actionLabel, onAction }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <div className="text-center py-14 sm:py-16">
    <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1.5">{title}</h3>
    <p className="text-xs sm:text-sm text-muted-foreground mb-5 max-w-xs mx-auto">{description}</p>
    <Button onClick={onAction} className="gap-2 h-10">
      {actionLabel}
    </Button>
  </div>
);

export default WishlistPage;
