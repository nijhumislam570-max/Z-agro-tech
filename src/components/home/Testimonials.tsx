import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Quote, Star, BadgeCheck } from 'lucide-react';

const testimonials = [
  {
    name: 'Karim Uddin',
    location: 'Bogura, Rajshahi',
    quote:
      'The hybrid rice seeds I bought boosted my yield by nearly 30%. Delivery was on time and the quality is unmatched in our area.',
    initials: 'KU',
  },
  {
    name: 'Fatima Begum',
    location: 'Comilla, Chattogram',
    quote:
      'I enrolled in the poultry farming course and within three months I started a small business at home. The instructors really care.',
    initials: 'FB',
  },
  {
    name: 'Rashed Mia',
    location: 'Jessore, Khulna',
    quote:
      'From fertilizer to advice on pest control, Z Agro Tech is my one-stop shop. Cash on delivery makes everything simple.',
    initials: 'RM',
  },
];

export const Testimonials = () => (
  <section
    className="bg-gradient-to-b from-secondary/30 to-background py-12 sm:py-16"
    aria-labelledby="testimonials-heading"
  >
    <div className="container mx-auto px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2">
          Farmer stories
        </p>
        <h2
          id="testimonials-heading"
          className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3"
        >
          Loved by farmers across Bangladesh
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Real stories from the farmers who trust Z Agro Tech every season.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {testimonials.map((t) => (
          <Card
            key={t.name}
            className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm hover:shadow-soft hover:-translate-y-1 transition-all"
          >
            {/* Giant decorative quote mark */}
            <Quote
              aria-hidden="true"
              className="absolute -top-4 -right-4 h-32 w-32 text-primary/5 rotate-12 pointer-events-none"
              strokeWidth={1}
            />

            <CardContent className="relative p-6 flex flex-col h-full">
              <Quote className="h-7 w-7 text-primary/40 mb-3" aria-hidden="true" />
              <div className="flex gap-0.5 mb-3" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-warning fill-warning" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-foreground leading-relaxed flex-1 mb-5">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                <Avatar className="h-11 w-11 ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-info/10 text-info text-[10px] font-semibold flex-shrink-0"
                      title="Verified farmer"
                    >
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
