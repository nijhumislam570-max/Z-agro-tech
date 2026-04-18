import { useState, useEffect } from 'react';
import { MapPin, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import ClinicCard from './ClinicCard';
import { supabase } from '@/integrations/supabase/client';

interface Clinic {
  id: string;
  name: string;
  rating: number | null;
  distance: string | null;
  services: string[] | null;
  image_url: string | null;
  is_open: boolean | null;
  is_verified: boolean | null;
}

const ClinicSection = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      // Use clinics_public view for security - excludes sensitive verification documents
      const { data, error } = await supabase
        .from('clinics_public')
        .select('*')
        .limit(3);
      
      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      // Error logged only in development
      if (import.meta.env.DEV) {
        console.error('Error fetching clinics:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'Surgery', 'Pharmacy', '24/7', 'Large Animal'];

  const handleBookClinic = (clinicId: string) => {
    navigate(`/book-appointment/${clinicId}`);
  };

  return (
    <section id="clinics" className="section-padding bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-xs sm:text-sm font-semibold mb-2 bg-primary/10 px-3 py-1 rounded-full">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Find Nearby
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Veterinary Clinics
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              Book appointments with trusted veterinarians near you
            </p>
          </div>
          <Link to="/clinics">
            <Button variant="outline" className="mt-4 md:mt-0 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all">
              <Filter className="h-4 w-4 mr-2" />
              View All Clinics
            </Button>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          {filters.map((filter, index) => (
            <button
              key={index}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 active:scale-95 ${
                activeFilter === filter
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'bg-card text-foreground border border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Clinic Cards */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No clinics found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto">
            {clinics.map((clinic) => (
              <ClinicCard 
                key={clinic.id}
                id={clinic.id}
                name={clinic.name}
                rating={clinic.rating || 4.5}
                distance={clinic.distance || '2 km'}
                services={clinic.services || []}
                image={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=400&fit=crop'}
                isOpen={clinic.is_open ?? true}
                isVerified={clinic.is_verified ?? true}
                onBook={() => handleBookClinic(clinic.id)}
                onViewDetails={() => navigate(`/clinic/${clinic.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ClinicSection;