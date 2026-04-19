import { Users, GraduationCap, Smile, Award } from 'lucide-react';
import heroImage from '@/assets/hero-agriculture-field.jpg';

const stats = [
  { icon: Users, value: '5,000+', label: 'Farmers trained' },
  { icon: GraduationCap, value: '40+', label: 'Courses delivered' },
  { icon: Smile, value: '98%', label: 'Satisfaction' },
  { icon: Award, value: '10+ yrs', label: 'Field experience' },
];

export const TrustStatsStrip = () => {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-14" aria-labelledby="trust-stats-heading">
      <h2 id="trust-stats-heading" className="sr-only">Z Agro Tech by the numbers</h2>
      <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-soft">
        {/* Background image */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={heroImage}
            alt=""
            loading="lazy"
            width={1920}
            height={1088}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70" />
        </div>

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
                <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 items-center justify-center mb-3">
                  <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-primary-foreground">{s.value}</p>
                <p className="text-xs sm:text-sm text-primary-foreground/80 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustStatsStrip;
