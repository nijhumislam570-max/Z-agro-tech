import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowRight, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'Do you deliver across Bangladesh?',
    a: 'Yes — we ship to all 8 divisions. Delivery typically takes 2–5 business days depending on your location, with Cash on Delivery available everywhere.',
  },
  {
    q: 'Are the courses suitable for beginners?',
    a: 'Absolutely. Our courses range from beginner-friendly introductions to advanced techniques. Each course lists its difficulty level and target audience clearly.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Cash on Delivery (COD) for products, plus mobile financial services like bKash and Nagad. Course enrollments are confirmed through WhatsApp.',
  },
  {
    q: 'Can I return a product if I am not satisfied?',
    a: 'Yes — most products are eligible for return within 7 days of delivery if unused and in original packaging. Some agricultural inputs (seeds, fertilizers) may have specific terms.',
  },
];

export const FAQTeaser = () => (
  <section
    className="container mx-auto px-4 sm:px-6 py-12 sm:py-16"
    aria-labelledby="faq-heading"
  >
    <div className="max-w-3xl mx-auto relative">
      {/* Giant decorative ? */}
      <span
        aria-hidden="true"
        className="hidden md:block absolute -top-6 -right-4 text-[180px] font-display font-bold text-primary/5 leading-none select-none pointer-events-none"
      >
        ?
      </span>

      <div className="relative text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-3">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>FAQ</span>
        </div>
        <h2
          id="faq-heading"
          className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3"
        >
          Frequently asked questions
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Quick answers to the most common questions from our farming community.
        </p>
      </div>

      <Accordion type="single" collapsible className="relative bg-card border border-border/60 rounded-2xl px-4 sm:px-6 shadow-soft">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className={i === faqs.length - 1 ? 'border-b-0' : ''}>
            <AccordionTrigger className="text-left text-sm sm:text-base font-semibold text-foreground hover:no-underline gap-3">
              <span className="flex items-center gap-3 flex-1 min-w-0">
                {/* Numbered circle badge */}
                <span
                  aria-hidden="true"
                  className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{f.q}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pl-10">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="relative text-center mt-6">
        <Link
          to="/faq"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View all FAQs <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </section>
);

export default FAQTeaser;
