import { forwardRef } from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { prefetchRoute } from '@/lib/imageUtils';

const prefetchHandlers = (path: string) => ({
  onMouseEnter: () => prefetchRoute(path),
  onTouchStart: () => prefetchRoute(path),
});

const quickLinks = [
  { label: 'Shop', path: '/shop' },
  { label: 'Academy', path: '/academy' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'FAQ', path: '/faq' },
];

const categories = [
  { label: 'Crops & Seeds', path: '/shop?type=Crops' },
  { label: 'Livestock & Feed', path: '/shop?type=Livestock' },
  { label: 'Fertilizer & Soil', path: '/shop?type=Fertilizer' },
  { label: 'Tools & Equipment', path: '/shop?type=Equipment' },
];

const socials = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
];

const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="bg-[hsl(140,35%,10%)] text-[hsl(60,20%,92%)]">
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-2 lg:col-span-1">
              <div className="mb-4">
                <Logo to="/" size="md" showText showSubtitle variant="footer" />
              </div>
              <p className="text-sm leading-relaxed text-[hsl(60,10%,70%)] mb-5 max-w-xs">
                Premium agriculture supplies and expert-led courses to help every farmer grow.
              </p>
              <nav aria-label="Social media" className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-[hsl(140,30%,18%)] flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                    aria-label={s.label}
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </nav>
            </div>

            <nav aria-label="Quick links">
              <h4 className="font-display font-semibold text-base mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2.5">
                {quickLinks.map((l) => (
                  <li key={l.label}>
                    <Link to={l.path} className="text-sm text-[hsl(60,10%,70%)] hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Categories">
              <h4 className="font-display font-semibold text-base mb-4 text-white">Categories</h4>
              <ul className="space-y-2.5">
                {categories.map((l) => (
                  <li key={l.label}>
                    <Link to={l.path} className="text-sm text-[hsl(60,10%,70%)] hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h4 className="font-display font-semibold text-base mb-4 text-white">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <a href="tel:+8801349219441" className="flex items-center gap-3 text-sm text-[hsl(60,10%,70%)] hover:text-primary group">
                    <span className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                    </span>
                    01349219441
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@zagrotech.com" className="flex items-center gap-3 text-sm text-[hsl(60,10%,70%)] hover:text-primary group">
                    <span className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                    </span>
                    hello@zagrotech.com
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-[hsl(60,10%,70%)]">
                  <span className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </span>
                  Dhaka, Bangladesh
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[hsl(140,30%,18%)] py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs sm:text-sm text-[hsl(60,8%,55%)] flex items-center gap-1.5">
            © 2026 Z Agro Tech. Cultivating innovation <Leaf className="h-3 w-3 text-primary inline" />
          </p>
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-[hsl(60,8%,55%)]">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
export default Footer;
