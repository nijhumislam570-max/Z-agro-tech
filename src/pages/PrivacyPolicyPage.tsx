import { memo } from 'react';
import { Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import SEO from '@/components/SEO';

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, make a purchase, book an appointment, or contact us for support.

**Personal Information:**
- Name, email address, phone number
- Shipping and billing addresses
- Pet information (names, species, breeds, photos)
- Profile photos and biographical information

**Automatically Collected Information:**
- Device information and browser type
- IP address and location data
- Usage patterns and preferences
- Cookies and similar tracking technologies`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

- Provide, maintain, and improve our services
- Process transactions and send related information
- Send you technical notices, updates, and support messages
- Respond to your comments, questions, and requests
- Communicate with you about products, services, and events
- Monitor and analyze trends, usage, and activities
- Detect, investigate, and prevent fraudulent transactions
- Personalize and improve your experience
- Facilitate connections between pet owners and veterinary services`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:

- **Service Providers:** With third-party vendors who help us operate our platform (payment processors, delivery partners, cloud hosting)
- **Clinics and Doctors:** When you book appointments, your contact information is shared with the relevant clinic
- **Legal Requirements:** When required by law or to protect our rights
- **Business Transfers:** In connection with any merger, acquisition, or sale of assets
- **With Your Consent:** When you explicitly agree to share information`,
  },
  {
    title: '4. Data Security',
    content: `We implement appropriate security measures to protect your personal information:

- Encryption of data in transit and at rest
- Regular security assessments and audits
- Access controls and authentication mechanisms
- Secure data storage with reputable cloud providers
- Regular backups and disaster recovery procedures

While we strive to protect your information, no method of transmission over the Internet is 100% secure.`,
  },
  {
    title: '5. Your Rights and Choices',
    content: `You have the right to:

- **Access:** Request a copy of your personal data
- **Correction:** Update or correct inaccurate information
- **Deletion:** Request deletion of your account and data
- **Opt-out:** Unsubscribe from marketing communications
- **Data Portability:** Export your data in a readable format

To exercise these rights, please contact us through our support channels.`,
  },
  {
    title: '6. Cookies and Tracking',
    content: `We use cookies and similar technologies to:

- Remember your preferences and settings
- Understand how you use our platform
- Improve our services and user experience
- Provide personalized content and recommendations

You can control cookie settings through your browser preferences. Note that disabling cookies may affect some platform functionality.`,
  },
  {
    title: "7. Children's Privacy",
    content: `VetMedix is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.`,
  },
  {
    title: '8. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.`,
  },
  {
    title: '9. Contact Us',
    content: `If you have any questions about this Privacy Policy or our data practices, please contact us:

**Email:** privacy@vetmedix.bd
**Address:** House #12, Road #5, Dhanmondi, Dhaka-1205, Bangladesh
**Phone:** +880 1700-000000`,
  },
];

const PrivacyPolicyPage = memo(() => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO
        title="Privacy Policy"
        description="Learn how VetMedix collects, uses, and protects your personal information. Read our full privacy policy."
        canonicalUrl="https://vetmedix.lovable.app/privacy"
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
            Last Updated: January 24, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <p className="text-foreground leading-relaxed">
              VetMedix ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our platform, including our website, mobile 
              applications, and related services.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
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
      <MobileNav />
    </div>
  );
});

PrivacyPolicyPage.displayName = 'PrivacyPolicyPage';

export default PrivacyPolicyPage;
