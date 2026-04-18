import { Users, GraduationCap, Smile, Award } from 'lucide-react';

const stats = [
  { icon: Users, value: '5,000+', label: 'Farmers trained' },
  { icon: GraduationCap, value: '40+', label: 'Courses delivered' },
  { icon: Smile, value: '98%', label: 'Satisfaction' },
  { icon: Award, value: '10+ yrs', label: 'Field experience' },
];

export const TrustStatsStrip = () => {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/40 to-accent/10 border border-border/60 p-6 sm:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-background items-center justify-center shadow-soft mb-2">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStatsStrip;
