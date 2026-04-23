import { useState, memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, X, Sprout, ShoppingBag, GraduationCap, Lock, SearchX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SEO from '@/components/SEO';
import EmptyState from '@/components/ui/empty-state';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type FAQCategory = {
  title: string;
  icon: LucideIcon;
  faqs: { question: string; answer: string }[];
};

const faqData: FAQCategory[] = [
  {
    title: 'General Questions',
    icon: Sprout,
    faqs: [
      { question: 'What is Z Agro Tech?', answer: 'Z Agro Tech is a comprehensive agriculture platform combining a premium marketplace for agri-inputs (seeds, fertilizers, crop-protection, tools) with the Smart Farming Academy — expert-led courses for modern farmers in Bangladesh.' },
      { question: 'Is Z Agro Tech free to use?', answer: 'Yes! Browsing products and courses, and creating an account is completely free. You only pay when you purchase a product or enrol in a paid course.' },
      { question: 'Which areas does Z Agro Tech serve?', answer: 'We deliver agri-inputs across all 64 districts of Bangladesh. Our online courses are available nationwide; on-site/hybrid sessions are scheduled by location.' },
    ],
  },
  {
    title: 'Shop & Products',
    icon: ShoppingBag,
    faqs: [
      { question: 'How do I place an order?', answer: 'Browse the Shop, add items to your cart, proceed to checkout, fill in your delivery address, and select Cash on Delivery. Your order will be confirmed immediately.' },
      { question: 'What payment methods are accepted?', answer: 'We currently support Cash on Delivery (COD) on all orders. Mobile banking (bKash, Nagad) and card payments are coming soon.' },
      { question: 'What are the delivery charges?', answer: 'Delivery charges depend on your division and order weight. The exact charge is calculated at checkout based on your address.' },
      { question: 'How can I track my order?', answer: "Once your order ships, you'll receive a tracking ID. Visit the Track Order page and enter your tracking ID to see real-time status from our courier partner." },
      { question: 'Can I return products?', answer: 'Yes, products can be returned within 7 days of delivery if they are damaged, expired, or not as described. Contact our support team to initiate a return.' },
      { question: 'Are your seeds and fertilizers genuine?', answer: 'Absolutely — every product on Z Agro Tech is sourced from verified suppliers with traceable batch records. We never list grey-market or counterfeit inputs.' },
    ],
  },
  {
    title: 'Academy & Courses',
    icon: GraduationCap,
    faqs: [
      { question: 'How do I enrol in a course?', answer: 'Open the Academy page, choose a course, and click "Enrol". You\'ll be guided through batch selection (where applicable) and confirmation. Our team will reach out via WhatsApp for next steps.' },
      { question: 'Are the courses online or on-site?', answer: 'Both. Each course lists its mode — Online, On-site, or Hybrid — along with batch dates and duration.' },
      { question: 'Will I receive a certificate?', answer: 'Most courses provide a certificate of completion. The course details page indicates whether a certificate is included.' },
      { question: 'Who teaches the courses?', answer: 'Our instructors are certified agronomists, plant pathologists, and seasoned farmers with proven on-field expertise.' },
    ],
  },
  {
    title: 'Account & Security',
    icon: Lock,
    faqs: [
      { question: 'How do I reset my password?', answer: 'Click "Forgot Password" on the sign-in page, enter your email, and we\'ll send you a reset link. Follow the link to set a new password.' },
      { question: 'Can I sign in with Google?', answer: 'Yes — use "Continue with Google" on the sign-in page for quick, secure authentication using your Google account.' },
      { question: 'Is my data secure?', answer: 'Yes. We use industry-standard encryption and never share your personal data without your consent.' },
    ],
  },
];

// Flat list used for the FAQPage JSON-LD schema (full dataset, not filtered).
const allFaqs = faqData.flatMap((c) => c.faqs);

const FAQPage = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const filteredCategories = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return faqData;
    return faqData
      .map((category) => ({
        ...category,
        faqs: category.faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(q) ||
            faq.answer.toLowerCase().includes(q),
        ),
      }))
      .filter((category) => category.faqs.length > 0);
  }, [debouncedQuery]);

  const totalMatches = useMemo(
    () => filteredCategories.reduce((sum, c) => sum + c.faqs.length, 0),
    [filteredCategories],
  );

  return (
    <>
      <SEO
        title="FAQs"
        description="Find answers to common questions about Z Agro Tech — products, orders, courses, delivery and account security."
        url="https://zagrotech.lovable.app/faq"
        canonicalUrl="https://zagrotech.lovable.app/faq"
        schema={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: 'https://zagrotech.lovable.app/' },
              { name: 'FAQ', url: 'https://zagrotech.lovable.app/faq' },
            ],
          },
          {
            type: 'FAQPage',
            items: allFaqs,
          },
        ]}
      />

      <main
        id="main-content"
        className="container mx-auto px-4 py-8 sm:py-12 animate-page-enter bg-gradient-to-b from-primary/5 via-background to-background flex-1"
        aria-label="Frequently Asked Questions"
      >
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Find answers to common questions about Z Agro Tech
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 rounded-xl text-base"
              aria-label="Search frequently asked questions"
              aria-describedby="faq-results-count"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Live results count for screen readers */}
          <p
            id="faq-results-count"
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {debouncedQuery
              ? `${totalMatches} ${totalMatches === 1 ? 'result' : 'results'} for "${debouncedQuery}"`
              : `${allFaqs.length} questions available`}
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="max-w-3xl mx-auto space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No FAQs found matching <span className="font-medium text-foreground">"{debouncedQuery}"</span>.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')} className="min-h-[44px]">
                Clear search
              </Button>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.title} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-3 border-b border-border">
                  <span className="text-2xl" aria-hidden="true">{category.icon}</span>
                  <h2 className="font-semibold text-foreground">{category.title}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {category.faqs.length}
                  </span>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {category.faqs.map((faq) => (
                    <AccordionItem
                      key={faq.question}
                      value={`${category.title}-${faq.question}`}
                      className="border-b border-border last:border-b-0"
                    >
                      <AccordionTrigger className="px-5 py-4 text-left hover:no-underline hover:bg-muted/30 text-sm sm:text-base">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Didn't find what you're looking for?
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Contact our support team →
          </Link>
        </div>
      </main>
    </>
  );
});

FAQPage.displayName = 'FAQPage';

export default FAQPage;
