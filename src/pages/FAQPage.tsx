import { useState, memo, useMemo } from 'react';
import { HelpCircle, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { Input } from '@/components/ui/input';
import SEO from '@/components/SEO';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqData = [
  {
    title: 'General Questions',
    icon: '📋',
    faqs: [
      { question: 'What is VetMedix?', answer: 'VetMedix is a comprehensive pet care platform that combines social networking for pets, veterinary clinic booking, and a pet product shop. It serves as your one-stop destination for all pet care needs in Bangladesh.' },
      { question: 'Is VetMedix free to use?', answer: 'Yes! Creating an account, browsing clinics, doctors, and creating pet profiles is completely free. You only pay when you purchase products or book paid clinic services.' },
      { question: 'Which areas does VetMedix serve?', answer: 'VetMedix currently serves all major cities and districts across Bangladesh. We are constantly expanding our network of verified clinics and delivery coverage.' },
    ],
  },
  {
    title: 'Pet Profiles & Social Features',
    icon: '🐾',
    faqs: [
      { question: 'How do I create a pet profile?', answer: "After signing in, go to your profile and click \"Add Pet\" or navigate to the pets section. Fill in your pet's details including name, species, breed, age, and optionally add a photo and bio." },
      { question: 'Can I have multiple pets on one account?', answer: 'Absolutely! You can add as many pet profiles as you want under your account. Each pet will have their own profile page and can post to the social feed.' },
      { question: 'How do I post to the social feed?', answer: "From the Feed page or your pet's profile, use the \"Create Post\" card to share photos, videos, or text updates. Select which pet is posting, add your content, and share!" },
      { question: 'What are Stories?', answer: "Stories are short-lived posts (24 hours) where you can share quick moments from your pet's day. They appear at the top of the feed and disappear after 24 hours." },
    ],
  },
  {
    title: 'Appointments & Clinics',
    icon: '🏥',
    faqs: [
      { question: 'How do I book an appointment?', answer: 'Browse the Clinics or Doctors page, select your preferred clinic or doctor, and click "Book Appointment". Choose your pet, select a date and time slot, and confirm your booking.' },
      { question: 'Can I cancel or reschedule an appointment?', answer: 'Yes, you can cancel appointments from your Profile under the Appointments tab. For rescheduling, cancel the current appointment and book a new one with your preferred time.' },
      { question: 'How do I know if a clinic is verified?', answer: 'Verified clinics display a blue verification badge. This means they have submitted required documentation (trade license, BVC certificate) and passed our admin review process.' },
      { question: 'What payment methods are available for appointments?', answer: 'Payment is typically made at the clinic during your visit. Some clinics may require advance booking fees which will be clearly mentioned during booking.' },
    ],
  },
  {
    title: 'Shopping & Orders',
    icon: '🛒',
    faqs: [
      { question: 'How do I place an order?', answer: 'Browse products in the Shop, add items to your cart, proceed to checkout, fill in your delivery address, and select Cash on Delivery. Your order will be confirmed immediately.' },
      { question: 'What payment methods are accepted?', answer: 'Currently we support Cash on Delivery (COD) for all orders. Mobile banking options (bKash, Nagad) and card payments are coming soon!' },
      { question: 'What are the delivery charges?', answer: 'Delivery is ৳60 inside Dhaka and ৳120 outside Dhaka. Orders above ৳500 qualify for free delivery within Dhaka!' },
      { question: 'How can I track my order?', answer: "Once your order is shipped, you'll receive a tracking ID. Go to Track Order page and enter your tracking ID to see real-time delivery status via our Steadfast courier integration." },
      { question: 'Can I return products?', answer: 'Yes, products can be returned within 7 days of delivery if they are damaged or not as described. Contact our support team to initiate a return.' },
    ],
  },
  {
    title: 'Account & Security',
    icon: '🔐',
    faqs: [
      { question: 'How do I reset my password?', answer: "Click \"Forgot Password\" on the login page, enter your email address, and we'll send you a password reset link. Follow the link to create a new password." },
      { question: 'Can I sign in with Google?', answer: 'Yes! You can use "Continue with Google" on the sign-in page for quick and secure authentication using your Google account.' },
      { question: 'How do I become a clinic owner or doctor?', answer: "During sign-up, select \"Clinic Owner\" or \"Doctor\" as your role. After creating your account, you'll need to complete the verification process by submitting required documents." },
      { question: 'Is my data secure?', answer: 'Yes, we use industry-standard encryption and security practices. Your personal data is protected and never shared without your consent.' },
    ],
  },
];

const FAQPage = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() =>
    faqData
      .map(category => ({
        ...category,
        faqs: category.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(category => category.faqs.length > 0),
    [searchQuery]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-20 md:pb-0">
      <SEO
        title="FAQs"
        description="Find answers to common questions about VetMedix — pet profiles, clinic booking, shopping, and account security."
        canonicalUrl="https://vetmedix.lovable.app/faq"
      />
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-4 py-8 sm:py-12 animate-page-enter" role="main" aria-label="Frequently Asked Questions">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Find answers to common questions about VetMedix
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl text-base"
              aria-label="Search frequently asked questions"
            />
          </div>
        </div>

        {/* FAQ Categories - all using shadcn Accordion */}
        <div className="max-w-3xl mx-auto space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No FAQs found matching your search.</p>
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
                  {category.faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${category.title}-${index}`}
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
          <a 
            href="/contact" 
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Contact our support team →
          </a>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
});

FAQPage.displayName = 'FAQPage';

export default FAQPage;
