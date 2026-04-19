import { Truck, BadgeCheck, Headphones, Wallet } from 'lucide-react';

const items = [
  { icon: Truck, label: 'Free shipping over ৳2,000' },
  { icon: Wallet, label: 'Cash on delivery' },
  { icon: BadgeCheck, label: 'Verified agri-experts' },
  { icon: Headphones, label: '24/7 farmer support' },
];

export const PartnersStrip = () => (
  <section
    className="border-y border-border/60 bg-muted/40"
    aria-labelledby="partners-heading"
  >
    <h2 id="partners-heading" className="sr-only">Why farmers trust Z Agro Tech</h2>
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 justify-center sm:justify-start text-center sm:text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-background border border-border/60 flex items-center justify-center flex-shrink-0">
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
