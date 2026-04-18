import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Award, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  id: string;
  name: string;
  specialization: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  avatar_url: string | null;
  clinic_id: string;
  clinic_name: string;
  clinic_address: string | null;
  clinic_is_verified: boolean;
  onBookAppointment?: () => void;
}

const DoctorCard = memo(({
  id,
  name,
  specialization,
  qualifications,
  experience_years,
  consultation_fee,
  is_available,
  is_verified,
  avatar_url,
  clinic_id,
  clinic_name,
  clinic_address,
  clinic_is_verified,
  onBookAppointment,
}: DoctorCardProps) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/doctor/${id}`);
  };

  const handleBookAppointment = () => {
    if (onBookAppointment) {
      onBookAppointment();
    } else {
      navigate(`/book-appointment/${clinic_id}?doctor=${id}`);
    }
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <article className="group bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" aria-label={`Dr. ${name}, ${specialization || 'General Veterinarian'}`}>
      {/* Header with avatar */}
      <div className="relative p-4 sm:p-5 pb-0">
        <div className="flex gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/20">
              <AvatarImage src={avatar_url || undefined} alt={name} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-lg sm:text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {is_available && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 bg-success rounded-full border-2 border-card flex items-center justify-center">
                <div className="h-2 w-2 bg-success-foreground rounded-full" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-1 flex items-center gap-1.5">
                  {name}
                  {is_verified && (
                    <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {specialization || 'General Veterinarian'}
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              {experience_years && (
                <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {experience_years}+ yrs
                </span>
              )}
              {consultation_fee && (
                <span className="text-xs sm:text-sm font-medium text-primary">
                  ৳{consultation_fee}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Qualifications */}
        {qualifications && qualifications.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {qualifications.slice(0, 4).map((qual) => (
              <Badge
                key={qual}
                variant="secondary"
                className="text-[10px] sm:text-xs px-2 py-0.5 font-medium"
              >
                {qual}
              </Badge>
            ))}
            {qualifications.length > 4 && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5">
                +{qualifications.length - 4}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Clinic Info */}
      <div className="px-4 sm:px-5 py-3 mt-3 bg-muted/30 border-t border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors flex-1 min-w-0"
            onClick={() => navigate(`/clinic/${clinic_id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/clinic/${clinic_id}`)}
            aria-label={`View ${clinic_name} clinic`}
          >
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {clinic_name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {is_verified && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 border-success/30 text-success bg-success-light">
                <Award className="h-2.5 w-2.5" />
                Verified
              </Badge>
            )}
            {clinic_is_verified && !is_verified && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 border-primary/30 text-primary">
                <BadgeCheck className="h-2.5 w-2.5" />
                Clinic
              </Badge>
            )}
          </div>
        </div>
        {clinic_address && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1 ml-5">
            {clinic_address}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 sm:p-4 pt-0 mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewProfile}
          className="flex-1 h-9 sm:h-10 text-xs sm:text-sm active:scale-95 transition-transform"
        >
          View Profile
        </Button>
        <Button
          size="sm"
          onClick={handleBookAppointment}
          disabled={!is_available}
          className={cn(
            "flex-1 h-9 sm:h-10 text-xs sm:text-sm active:scale-95 transition-transform",
            !is_available && "opacity-50"
          )}
        >
          {is_available ? 'Book Now' : 'Unavailable'}
        </Button>
      </div>
    </article>
  );
});

DoctorCard.displayName = 'DoctorCard';

export default DoctorCard;
