import { Search, ShoppingBag, Sprout } from 'lucide-react';

const steps = [
  {
    n: '01',
    icon: Search,
    title: 'Browse & discover',
    desc: 'Explore curated agriculture products and expert-led courses tailored to Bangladesh farming.',
    stat: '500+ products',
  },
  {
    n: '02',
    icon: ShoppingBag,
    title: 'Order or enroll',
    desc: 'Pay cash on delivery for products, or enroll in courses with a single tap and start learning.',
    stat: 'COD nationwide',
  },
  {
    n: '03',
    icon: Sprout,
    title: 'Grow smarter',
    desc: 'Apply expert techniques and quality inputs to boost yield, reduce loss, and grow your income.',
    stat: '+30% avg. yield',
  },
];

const HEX_CLIP = 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)';

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
      {/* dashed connecting line on desktop */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute top-12 left-[16%] right-[16%] border-t-2 border-dashed border-primary/30"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 relative">
        {steps.map((s) => (
          <div key={s.n} className="text-center">
            <div className="relative inline-flex items-center justify-center mb-5">
              {/* Hexagonal step badge */}
              <div
                className="h-24 w-24 bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 flex items-center justify-center shadow-soft"
                style={{ clipPath: HEX_CLIP }}
                aria-hidden="true"
              >
                <s.icon className="h-9 w-9 text-primary" />
              </div>
              {/* Step number badge — small circle */}
              <span className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-background">
                {s.n}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2">
              {s.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-4">{s.desc}</p>

            {/* Speech-bubble style mini-stat pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-primary/20 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              <span className="text-xs font-semibold text-foreground">{s.stat}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
