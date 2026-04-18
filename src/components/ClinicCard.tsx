import { memo, forwardRef } from 'react';
import { Star, MapPin, Stethoscope, ChevronRight, Phone, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import gopalganjLogo from '@/assets/gopalganj-vet-care-logo.png';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface ClinicCardProps {
  id?: string;
  name: string;
  rating: number;
  distance: string;
  services: string[];
  image: string;
  isOpen?: boolean;
  isVerified?: boolean;
  onBook?: () => void;
  onViewDetails?: () => void;
}

const ClinicCard = memo(forwardRef<HTMLDivElement, ClinicCardProps>(({ name, rating, distance, services, image, isOpen = true, isVerified = true, onBook, onViewDetails }, ref) => {
  const isGopalganj = name?.toLowerCase().includes('gopalganj');
  
  return (
    <article ref={ref} className="group bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-300 hover:shadow-lg sm:hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.98]" aria-label={`${name} clinic, rated ${rating.toFixed(1)}`}>
      <div className="flex">
        {/* Image Section with stable aspect ratio */}
        <div 
          className="relative w-24 sm:w-32 md:w-36 lg:w-44 flex-shrink-0 cursor-pointer overflow-hidden bg-gradient-to-br from-primary/5 to-secondary"
          onClick={onViewDetails}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onViewDetails?.()}
          aria-label={`View ${name} details`}
        >
          {isGopalganj ? (
            <OptimizedImage 
              src={gopalganjLogo} 
              alt={name}
              width={176}
              height={176}
              className="w-full h-full bg-card"
            />
          ) : (
            <OptimizedImage 
              src={image} 
              alt={name}
              preset="thumbnail"
              width={176}
              height={176}
              className="w-full h-full"
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badge on Image */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className={cn(
                "text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 shadow-md backdrop-blur-md border-0",
                isOpen 
                  ? 'bg-success text-success-foreground hover:bg-success' 
                  : 'bg-muted text-muted-foreground hover:bg-muted'
              )}
            >
              <div className={cn(
                "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1",
                isOpen ? "bg-success-foreground animate-pulse" : "bg-muted-foreground"
              )} />
              {isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>

          {/* Verified Badge */}
          {isVerified && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
              <div className="bg-card/95 backdrop-blur-md text-primary rounded-full p-1 sm:p-1.5 shadow-md">
                <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
            </div>
          )}
        </div>
        
        {/* Content Section - Mobile optimized */}
        <div className="flex-1 p-2 sm:p-4 lg:p-5 flex flex-col justify-between min-w-0">
          {/* Header */}
          <div className="mb-1 sm:mb-2">
            <h3 
              className="font-bold text-sm sm:text-base lg:text-lg text-foreground group-hover:text-primary cursor-pointer transition-colors line-clamp-1 mb-0.5 sm:mb-1"
              onClick={onViewDetails}
            >
              {name}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
              {/* Rating */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-warning-light border border-warning/20 rounded px-1.5 py-0.5 sm:rounded-lg sm:px-2 sm:py-1">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-warning fill-warning" />
                <span className="text-[10px] sm:text-xs font-bold text-warning-foreground">{rating.toFixed(1)}</span>
              </div>
              {/* Distance */}
              <span className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {distance}
              </span>
              {/* Verified Text - Hidden on smallest screens */}
              {isVerified && (
                <span className="hidden md:flex items-center gap-1 text-xs text-primary font-medium">
                  <Award className="h-3 w-3" />
                  Certified
                </span>
              )}
            </div>
          </div>
          
          {/* Services - Compact for mobile */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-3">
            {services.filter(s => s && s.trim()).slice(0, 2).map((service, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] lg:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded sm:rounded-lg bg-primary/5 text-primary/80 border border-primary/10"
              >
                <Stethoscope className="h-2 w-2 sm:h-2.5 sm:w-2.5 opacity-70 flex-shrink-0" />
                <span className="truncate max-w-[60px] sm:max-w-[80px] lg:max-w-[100px]">{service}</span>
              </span>
            ))}
            {services.filter(s => s && s.trim()).length > 2 && (
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground bg-muted/50 px-1.5 sm:px-2 py-0.5 rounded sm:rounded-lg font-medium">
                +{services.filter(s => s && s.trim()).length - 2}
              </span>
            )}
            {services.filter(s => s && s.trim()).length === 0 && (
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground italic">
                Services available
              </span>
            )}
          </div>
          
          {/* Actions - Compact for mobile */}
          <div className="flex gap-1.5 sm:gap-2 pt-1.5 sm:pt-3 border-t border-border/40">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-7 sm:h-8 lg:h-9 text-[10px] sm:text-xs rounded-lg hover:bg-secondary/80 active:scale-[0.98] transition-all font-medium px-2 sm:px-3" 
              onClick={onViewDetails}
            >
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 opacity-70" />
              <span className="hidden xs:inline">View</span> Details
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 h-7 sm:h-8 lg:h-9 text-[10px] sm:text-xs rounded-lg shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98] transition-all font-semibold px-2 sm:px-3" 
              onClick={onBook}
            >
              Book<span className="hidden xs:inline"> Now</span>
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}));

ClinicCard.displayName = 'ClinicCard';

export default ClinicCard;
