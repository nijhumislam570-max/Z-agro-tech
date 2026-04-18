import { memo } from 'react';
import { Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us when you create an account, place an order, enrol in a course, or contact us for support.

**Personal Information:**
- Name, email address, phone number
- Shipping and billing addresses
- Order history and course enrolments
- Profile photo (optional)

**Automatically Collected Information:**
- Device information and browser type
- IP address and approximate location
- Usage patterns and preferences
- Cookies and similar tracking technologies`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

- Provide, maintain, and improve our services
- Process orders, deliveries, and course enrolments
- Send you technical notices, order updates, and support messages
- Respond to your comments, questions, and requests
- Communicate with you about products, courses, offers, and events
- Monitor and analyse trends, usage, and activities
- Detect, investigate, and prevent fraudulent transactions
- Personalise and improve your experience`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:

- **Service Providers:** With third-party vendors who help us operate the platform (payment processors, courier and delivery partners, cloud hosting)
- **Legal Requirements:** When required by law or to protect our rights, property, or safety
- **Business Transfers:** In connection with any merger, acquisition, or sale of assets
- **With Your Consent:** When you explicitly agree to share information`,
  },
  {
    title: '4. Data Security',
    content: `We implement appropriate technical and organisational measures to protect your personal information:

- Encryption of data in transit and at rest
- Regular security assessments
- Strict access controls and authentication
- Secure data storage with reputable cloud providers
- Regular backups and disaster recovery procedures

While we strive to protect your information, no method of transmission over the Internet is 100% secure.`,
  },
  {
    title: '5. Your Rights and Choices',
    content: `You have the right to:

- **Access:** Request a copy of your personal data
- **Correction:** Update or correct inaccurate information
- **Deletion:** Request deletion of your account and data (subject to legal obligations such as tax records)
- **Opt-out:** Unsubscribe from marketing communications at any time
- **Data Portability:** Export your data in a readable format

To exercise these rights, contact us through the support channels listed below.`,
  },
  {
    title: '6. Cookies and Tracking',
    content: `We use cookies and similar technologies to:

- Remember your preferences and settings
- Keep you signed in
- Understand how you use our platform
- Improve our services and user experience
- Provide personalised product and course recommendations

You can control cookie settings through your browser preferences. Note that disabling cookies may affect some platform functionality (such as cart persistence).`,
  },
  {
    title: "7. Children's Privacy",
    content: `Z Agro Tech is intended for users aged 18 and above (or with verifiable parental consent). We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately and we will delete it.`,
  },
  {
    title: '8. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.`,
  },
  {
    title: '9. Contact Us',
    content: `If you have any questions about this Privacy Policy or our data practices, please contact us:

**Email:** privacy@zagrotech.com
**Address:** Farmgate, Dhaka 1205, Bangladesh
**Phone:** +880 1349-219441`,
  },
];

const PrivacyPolicyPage = memo(() => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy"
        description="Learn how Z Agro Tech collects, uses, and protects your personal information. Read our full privacy policy."
        canonicalUrl="https://zagrotech.lovable.app/privacy"
      />
      <Navbar />

      <main id="main-content" className="container mx-auto px-4 md:px-8 py-8 sm:py-12 animate-page-enter font-nunito" role="main" aria-label="Privacy Policy">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 font-fredoka">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Last Updated: April 18, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <p className="text-foreground leading-relaxed">
              Z Agro Tech ("we", "our", or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our platform — including our website, mobile
              applications, and related services.
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

      <Footer />
    </div>
  );
});

PrivacyPolicyPage.displayName = 'PrivacyPolicyPage';

export default PrivacyPolicyPage;
