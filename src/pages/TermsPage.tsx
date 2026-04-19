import { memo } from 'react';
import { FileText } from 'lucide-react';
import SEO from '@/components/SEO';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using Z Agro Tech, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.

These Terms apply to all users of the platform, including buyers, course enrollees, and visitors.`,
  },
  {
    title: '2. Description of Service',
    content: `Z Agro Tech provides:

- A curated marketplace for premium agriculture products (seeds, fertilizers, crop-protection, tools, and equipment)
- The Smart Farming Academy — expert-led online, on-site, and hybrid courses
- Order management, delivery, and tracking via partnered couriers
- Customer support and post-purchase guidance for products and courses

We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.`,
  },
  {
    title: '3. User Accounts',
    content: `**Account Creation:**
- You must provide accurate, complete, and current information
- You are responsible for maintaining the confidentiality of your account
- You must be at least 18 years old, or have a parent/guardian's consent, to create an account
- One person or entity may not maintain more than one account

**Account Responsibilities:**
- You are responsible for all activities under your account
- You must notify us immediately of any unauthorized access
- We may suspend or terminate accounts that violate these terms`,
  },
  {
    title: '4. User Conduct',
    content: `You agree not to:

- Post false, misleading, or fraudulent content
- Impersonate any person or entity
- Harass, abuse, or harm other users or our staff
- Upload viruses or malicious code
- Violate any applicable laws or regulations
- Collect user information without consent
- Use the platform for spam or unauthorized advertising
- Attempt to gain unauthorized access to our systems

Violation of these guidelines may result in account suspension or termination.`,
  },
  {
    title: '5. E-Commerce and Purchases',
    content: `**Orders:**
- All prices are listed in Bangladeshi Taka (BDT)
- Prices are subject to change without notice
- We reserve the right to refuse or cancel orders, particularly in cases of suspected fraud or pricing errors

**Payment:**
- Payment is due at the time of purchase or upon delivery (Cash on Delivery)
- You agree to pay all charges associated with your order, including delivery fees and applicable taxes
- Fraudulent payment information will result in order cancellation and may be reported to authorities

**Delivery:**
- Delivery times are estimates and not guaranteed
- Risk of loss transfers to you upon delivery
- Inspect products upon delivery and report damages or shortages within 48 hours`,
  },
  {
    title: '6. Returns and Refunds',
    content: `**Eligibility:**
- Products may be returned within 7 days of delivery if damaged, expired, or materially different from the listing
- Opened seed packets, fertilizers, and chemicals are non-returnable for safety and integrity reasons unless found defective on arrival

**Process:**
- Contact our support team to initiate a return
- Approved refunds are processed within 7 business days via the original payment method or store credit`,
  },
  {
    title: '7. Smart Farming Academy',
    content: `**Enrolment:**
- Course availability and batch dates are subject to change
- Enrolment is confirmed only after payment (where applicable) and our team's confirmation
- Some courses may have prerequisites or seat caps

**Cancellation:**
- Refunds for paid courses are available up to 48 hours before the batch start date
- Once a batch begins, fees are non-refundable

**Certification:**
- Certificates are issued on satisfactory completion of the curriculum and any required assessments
- Z Agro Tech certificates are issued for educational acknowledgement and do not constitute a government licence`,
  },
  {
    title: '8. Content and Intellectual Property',
    content: `**User Content:**
- You retain ownership of content you post (such as reviews and feedback)
- By posting, you grant us a non-exclusive, worldwide licence to use, display, and distribute your content in connection with our services
- You are responsible for ensuring you have rights to any content you post
- We may remove content that violates our policies

**Our Content:**
- Z Agro Tech logos, designs, course materials, and platform content are our intellectual property
- You may not use our branding or course materials without written permission
- Unauthorized use may result in legal action`,
  },
  {
    title: '9. Disclaimer of Warranties',
    content: `Z Agro Tech is provided "as is" and "as available" without warranties of any kind.

We do not warrant that:
- The service will be uninterrupted or error-free
- Results obtained from use of products or courses will meet your expectations
- Farming outcomes will match any examples shown in marketing or course content (results depend on weather, soil, practice, and other factors)

We are not responsible for:
- Actions of third-party suppliers or couriers
- Content posted by other users
- Technical issues beyond our control`,
  },
  {
    title: '10. Limitation of Liability',
    content: `To the maximum extent permitted by law, Z Agro Tech shall not be liable for:

- Indirect, incidental, or consequential damages
- Loss of profits, crops, data, or goodwill
- Service interruptions or failures
- Misuse of products or course content by users

Our total liability shall not exceed the amount you paid us in the past 12 months.`,
  },
  {
    title: '11. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of Bangladesh. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Dhaka, Bangladesh.`,
  },
  {
    title: '12. Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the new terms.`,
  },
  {
    title: '13. Contact Information',
    content: `For questions about these Terms of Service, please contact us:

**Email:** legal@zagrotech.com
**Address:** Farmgate, Dhaka 1205, Bangladesh
**Phone:** +880 1349-219441`,
  },
];

const TermsPage = memo(() => {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Review the Terms of Service for using the Z Agro Tech platform — products, courses, payments, delivery, and liability."
        canonicalUrl="https://zagrotech.lovable.app/terms"
      />

      <main id="main-content" className="container mx-auto px-4 md:px-8 py-8 sm:py-12 animate-page-enter font-nunito" role="main" aria-label="Terms of Service">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 font-fredoka">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Last Updated: April 18, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <p className="text-foreground leading-relaxed">
              Welcome to Z Agro Tech. These Terms of Service govern your use of our platform —
              including our website, mobile applications, and all related services. Please read
              these terms carefully before using our services.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-3xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <section key={index} className="bg-card rounded-2xl border border-border p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 font-fredoka">
                {section.title}
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                {section.content.split('\n\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-4 last:mb-0 whitespace-pre-line leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
});

TermsPage.displayName = 'TermsPage';

export default TermsPage;
