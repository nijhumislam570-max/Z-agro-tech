import { forwardRef } from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Heart, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const quickLinks = [
  { label: 'Shop', path: '/shop' },
  { label: 'Clinics', path: '/clinics' },
  { label: 'Doctors', path: '/doctors' },
  { label: 'Blog', path: '/blog' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'FAQs', path: '/faq' },
];

const categories = [
  { label: 'Dog Food', path: '/shop?type=dog' },
  { label: 'Cat Food', path: '/shop?type=cat' },
  { label: 'Cattle Feed', path: '/shop?type=cattle' },
  { label: 'Medicines', path: '/shop?type=medicine' },
  { label: 'Accessories', path: '/shop?type=accessory' },
];

const socialLinks = [
  {
    icon: Facebook,
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61573912760783',
    active: true,
  },
  { icon: Instagram, label: 'Instagram', href: '#', active: false },
  { icon: Youtube, label: 'YouTube', href: '#', active: false },
];

const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="bg-[hsl(220,25%,15%)] text-[hsl(0,0%,92%)]">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="mb-4">
                <Logo to="/" size="md" showText showSubtitle variant="footer" />
              </div>
              <p className="text-sm leading-relaxed text-[hsl(220,15%,65%)] mb-5 max-w-xs">
                Your trusted partner for pet and farm animal care across Bangladesh.
              </p>
              <nav aria-label="Social media links" className="flex gap-3">
                {socialLinks.map((social) => (
                  social.active ? (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-[hsl(220,20%,22%)] flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 active:scale-95"
                      aria-label={`${social.label} page`}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ) : (
                    <button
                      key={social.label}
                      type="button"
                      className="h-10 w-10 rounded-full bg-[hsl(220,20%,22%)] flex items-center justify-center opacity-40 cursor-not-allowed"
                      aria-label={`${social.label} - Coming soon`}
                      title="Coming soon"
                    >
                      <social.icon className="h-4 w-4" />
                    </button>
                  )
                ))}
              </nav>
            </div>

            {/* Quick Links */}
            <nav aria-label="Quick links">
              <h4 className="font-display font-semibold text-sm sm:text-base mb-4 text-[hsl(0,0%,100%)]">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm text-[hsl(220,15%,65%)] hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                    >
                      <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Categories */}
            <nav aria-label="Product categories">
              <h4 className="font-display font-semibold text-sm sm:text-base mb-4 text-[hsl(0,0%,100%)]">
                Categories
              </h4>
              <ul className="space-y-2.5">
                {categories.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm text-[hsl(220,15%,65%)] hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                    >
                      <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact */}
            <div>
              <h4 className="font-display font-semibold text-sm sm:text-base mb-4 text-[hsl(0,0%,100%)]">
                Contact Us
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="tel:+8801349219441"
                    className="flex items-center gap-3 text-sm text-[hsl(220,15%,65%)] hover:text-primary transition-colors group"
                  >
                    <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                    </span>
                    01349219441
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:vetmedix.25@gmail.com"
                    className="flex items-center gap-3 text-sm text-[hsl(220,15%,65%)] hover:text-primary transition-colors group"
                  >
                    <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                    </span>
                    vetmedix.25@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-[hsl(220,15%,65%)]">
                  <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </span>
                  Framgate, Dhaka, 1205
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[hsl(220,20%,22%)] py-5 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs sm:text-sm text-[hsl(220,15%,50%)] text-center sm:text-left flex items-center gap-1">
            © 2026 VET-MEDIX. Made with <Heart className="h-3 w-3 text-primary inline fill-primary" /> for pets
          </p>
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-[hsl(220,15%,50%)]">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
