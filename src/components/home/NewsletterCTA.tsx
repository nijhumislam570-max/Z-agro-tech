import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Send, Sprout } from 'lucide-react';
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
    // Simulate request
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
        {/* decorative elements */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <Sprout className="absolute top-8 right-8 h-12 w-12 text-primary-foreground/10" />
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
              className="h-12 bg-background/95 border-primary-foreground/20 placeholder:text-muted-foreground/70"
              required
            />
            <Button
              type="submit"
              size="lg"
              variant="accent"
              disabled={submitting}
              className="h-12 px-6 rounded-xl gap-2 shrink-0"
            >
              {submitting ? 'Joining…' : 'Subscribe'}
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-primary-foreground/70 mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;
