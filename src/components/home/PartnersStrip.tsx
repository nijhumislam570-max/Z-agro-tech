import { Truck, BadgeCheck, Headphones, Wallet } from 'lucide-react';

const items = [
  { icon: Truck, label: 'Free shipping over ৳2,000' },
  { icon: Wallet, label: 'Cash on delivery' },
  { icon: BadgeCheck, label: 'Verified agri-experts' },
  { icon: Headphones, label: '24/7 farmer support' },
];

export const PartnersStrip = () => (
  <section
    className="relative border-y border-border/60 bg-muted/40"
    aria-labelledby="partners-heading"
  >
    {/* Top accent gradient line */}
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
    />
    <h2 id="partners-heading" className="sr-only">Why farmers trust Z Agro Tech</h2>
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:divide-x md:divide-border/60">
        {items.map((item) => (
          <div
            key={item.label}
            className="group flex items-center gap-2.5 justify-center md:justify-start text-center md:text-left px-2 md:px-4 py-1.5 rounded-xl hover:bg-background/70 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="h-9 w-9 rounded-lg bg-background border border-border/60 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 group-hover:shadow-soft transition-all">
              <item.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PartnersStrip;
