import { memo } from 'react';
import { FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import SEO from '@/components/SEO';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using VetMedix, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.

These Terms apply to all users of the platform, including pet owners, clinic owners, doctors, and visitors.`,
  },
  {
    title: '2. Description of Service',
    content: `VetMedix provides:

- A social networking platform for pet owners and their pets
- A marketplace for pet products and supplies
- A directory and booking system for veterinary clinics and doctors
- Communication tools between pet owners and veterinary service providers

We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.`,
  },
  {
    title: '3. User Accounts',
    content: `**Account Creation:**
- You must provide accurate, complete, and current information
- You are responsible for maintaining the confidentiality of your account
- You must be at least 13 years old to create an account
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
- Harass, abuse, or harm other users
- Upload viruses or malicious code
- Violate any applicable laws or regulations
- Collect user information without consent
- Use the platform for spam or unauthorized advertising
- Attempt to gain unauthorized access to our systems

Violation of these guidelines may result in account suspension or termination.`,
  },
  {
    title: '5. Clinic and Doctor Verification',
    content: `**For Clinic Owners and Doctors:**
- You must provide accurate professional credentials
- Submitted documents (trade licenses, BVC certificates, NID) are subject to verification
- False information will result in immediate account termination
- Verified status can be revoked if violations are discovered

**For Users:**
- Verification badges indicate that credentials have been reviewed
- Users should still exercise their own judgment when booking services
- VetMedix is not responsible for the quality of veterinary care provided`,
  },
  {
    title: '6. E-Commerce and Purchases',
    content: `**Orders:**
- All prices are in Bangladeshi Taka (BDT)
- Prices are subject to change without notice
- We reserve the right to refuse or cancel orders

**Payment:**
- Payment is due at the time of purchase or upon delivery (COD)
- You agree to pay all charges associated with your order
- Fraudulent payment information will result in order cancellation

**Delivery:**
- Delivery times are estimates and not guaranteed
- Risk of loss transfers to you upon delivery
- Inspect products upon delivery and report issues immediately`,
  },
  {
    title: '7. Appointments',
    content: `**Booking:**
- Appointment availability is subject to clinic and doctor schedules
- Booking confirmation does not guarantee service availability
- Some clinics may require advance payment or deposits

**Cancellation:**
- You may cancel appointments through your account
- Repeated no-shows may result in booking restrictions
- Clinic cancellation policies may apply

**Liability:**
- VetMedix facilitates but does not provide veterinary services
- We are not liable for the quality of care provided by clinics or doctors`,
  },
  {
    title: '8. Content and Intellectual Property',
    content: `**User Content:**
- You retain ownership of content you post
- By posting, you grant us a license to use, display, and distribute your content
- You are responsible for ensuring you have rights to content you post
- We may remove content that violates our policies

**Our Content:**
- VetMedix logos, designs, and content are our intellectual property
- You may not use our branding without written permission
- Unauthorized use may result in legal action`,
  },
  {
    title: '9. Disclaimer of Warranties',
    content: `VetMedix is provided "as is" and "as available" without warranties of any kind.

We do not warrant that:
- The service will be uninterrupted or error-free
- Results obtained will be accurate or reliable
- The quality of products or services will meet your expectations

We are not responsible for:
- Actions of third-party service providers
- Content posted by other users
- Technical issues beyond our control`,
  },
  {
    title: '10. Limitation of Liability',
    content: `To the maximum extent permitted by law, VetMedix shall not be liable for:

- Indirect, incidental, or consequential damages
- Loss of profits, data, or goodwill
- Service interruptions or failures
- Actions of clinics, doctors, or other users

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

**Email:** legal@vetmedix.bd
**Address:** House #12, Road #5, Dhanmondi, Dhaka-1205, Bangladesh
**Phone:** +880 1700-000000`,
  },
];

const TermsPage = memo(() => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO
        title="Terms of Service"
        description="Review the Terms of Service for using the VetMedix platform, including account usage, purchases, appointments, and liability."
        canonicalUrl="https://vetmedix.lovable.app/terms"
      />
      <Navbar />
      
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
            Last Updated: January 24, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <p className="text-foreground leading-relaxed">
              Welcome to VetMedix. These Terms of Service govern your use of our platform, 
              including our website, mobile applications, and all related services. Please 
              read these terms carefully before using our services.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
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

TermsPage.displayName = 'TermsPage';

export default TermsPage;
