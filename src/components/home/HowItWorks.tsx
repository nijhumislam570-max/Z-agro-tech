import { Search, ShoppingBag, Sprout } from 'lucide-react';

const steps = [
  {
    n: '01',
    icon: Search,
    title: 'Browse & discover',
    desc: 'Explore curated agriculture products and expert-led courses tailored to Bangladesh farming.',
  },
  {
    n: '02',
    icon: ShoppingBag,
    title: 'Order or enroll',
    desc: 'Pay cash on delivery for products, or enroll in courses with a single tap and start learning.',
  },
  {
    n: '03',
    icon: Sprout,
    title: 'Grow smarter',
    desc: 'Apply expert techniques and quality inputs to boost yield, reduce loss, and grow your income.',
  },
];

export const HowItWorks = () => (
  <section
    className="container mx-auto px-4 sm:px-6 py-12 sm:py-16"
    aria-labelledby="how-it-works-heading"
  >
    <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-12">
      <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2">
        How it works
      </p>
      <h2
        id="how-it-works-heading"
        className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3"
      >
        Three simple steps to a better harvest
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground">
        From browsing to growing, we make modern agriculture accessible for every farmer.
      </p>
    </div>

    <div className="relative">
      {/* connecting line on desktop */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
        {steps.map((s) => (
          <div key={s.n} className="text-center">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 flex items-center justify-center shadow-soft">
                <s.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <span className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                {s.n}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2">
              {s.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
