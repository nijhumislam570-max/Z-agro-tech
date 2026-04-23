import { Users, GraduationCap, Smile, Award } from 'lucide-react';
import heroImage from '@/assets/hero-agriculture-field.jpg';

const stats = [
  { icon: Users, value: '5,000+', label: 'Farmers trained', percent: 92 },
  { icon: GraduationCap, value: '40+', label: 'Courses delivered', percent: 80 },
  { icon: Smile, value: '98%', label: 'Satisfaction', percent: 98 },
  { icon: Award, value: '10+ yrs', label: 'Field experience', percent: 85 },
];

const HEX_CLIP = 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)';

export const TrustStatsStrip = () => {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-14" aria-labelledby="trust-stats-heading">
      <h2 id="trust-stats-heading" className="sr-only">Z Agro Tech by the numbers</h2>
      <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-soft">
        {/* Background image — same source as Hero so the browser serves it from cache. */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={heroImage}
            alt=""
            loading="lazy"
            decoding="async"
            width={1920}
            height={1088}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70" />
        </div>

        {/* Decorative corner triangles */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 w-24 h-24 bg-primary-foreground/10"
          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-24 h-24 bg-primary-foreground/10"
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
        />

        <div className="relative z-10 p-6 sm:p-10 lg:p-12">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm font-semibold text-primary-foreground/80 uppercase tracking-wider mb-2">
              Our impact
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-primary-foreground">
              Empowering farmers, one harvest at a time
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                {/* Hexagonal icon container */}
                <div
                  className="inline-flex h-16 w-16 sm:h-18 sm:w-18 bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/25 items-center justify-center mb-3"
                  style={{ clipPath: HEX_CLIP }}
                  aria-hidden="true"
                >
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-primary-foreground">{s.value}</p>
                <p className="text-xs sm:text-sm text-primary-foreground/80 mt-1 mb-2">{s.label}</p>
                {/* Decorative progress bar */}
                <div
                  className="mx-auto h-1 w-16 rounded-full bg-primary-foreground/20 overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className="h-full bg-primary-foreground/70 rounded-full"
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustStatsStrip;
