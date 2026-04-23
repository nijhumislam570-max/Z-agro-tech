import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Send, Sprout, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const NewsletterCTA = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    // TODO(newsletter): wire to a `newsletter_subscribers` table or external
    // ESP. Until then this is intentionally optimistic — see /admin/settings
    // to track subscriber demand.
    if (import.meta.env.DEV) {
      console.warn('[NewsletterCTA] Subscription is not persisted yet.', { email });
    }
    await new Promise((r) => setTimeout(r, 600));
    toast.success("You're on the list! We'll keep you posted.");
    setEmail('');
    setSubmitting(false);
  };

  return (
    <section
      className="container mx-auto px-4 sm:px-6 py-12 sm:py-16"
      aria-labelledby="newsletter-heading"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[hsl(142,45%,32%)] p-8 sm:p-12 lg:p-16 shadow-xl">
        {/* decorative shapes */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <Sprout className="absolute top-8 right-8 h-12 w-12 text-primary-foreground/10" />

          {/* Hexagon */}
          <div
            className="hidden sm:block absolute top-10 left-10 w-14 h-14 bg-primary-foreground/10"
            style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}
          />
          {/* Triangle */}
          <div
            className="hidden sm:block absolute bottom-10 right-20 w-10 h-10 bg-primary-foreground/15"
            style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
          />
          {/* Small circle */}
          <div className="hidden sm:block absolute top-1/2 left-[8%] w-6 h-6 rounded-full bg-primary-foreground/15" />
          {/* Square rotated */}
          <div className="hidden sm:block absolute bottom-16 left-[35%] w-7 h-7 bg-accent/30 rotate-45" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 text-xs font-medium text-primary-foreground mb-4">
            <Mail className="h-3.5 w-3.5" />
            <span>Newsletter</span>
          </div>
          <h2
            id="newsletter-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-primary-foreground mb-3"
          >
            Join the modern farming movement
          </h2>
          <p className="text-sm sm:text-base text-primary-foreground/85 mb-6 sm:mb-8 max-w-xl mx-auto">
            Get seasonal tips, exclusive product drops, and free course previews — straight to your inbox.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-full px-5 bg-background text-foreground border-primary-foreground/30 placeholder:text-muted-foreground"
              required
            />
            <Button
              type="submit"
              size="lg"
              variant="accent"
              disabled={submitting}
              className="h-12 px-6 rounded-full gap-2 shrink-0 shadow-lg"
            >
              {submitting ? 'Joining…' : 'Subscribe'}
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* "100% free" badge chip */}
          <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 border border-primary-foreground/20 text-xs font-medium text-primary-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>100% free · No spam · Unsubscribe anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;
