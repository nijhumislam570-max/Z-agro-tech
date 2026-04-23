import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { emailSchema } from '@/lib/validations';
import SEO from '@/components/SEO';

const ForgotPasswordPage = () => {
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefilledEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Refocus the email field when returning from the success state
  useEffect(() => {
    if (!sent) emailInputRef.current?.focus();
  }, [sent]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setEmailError(result.error.errors[0]?.message || 'Invalid email');
      emailInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      const raw = (error?.message || '').toLowerCase();
      let friendly = 'Failed to send reset link. Please try again.';
      if (raw.includes('rate limit') || raw.includes('for security purposes')) {
        friendly = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (raw.includes('invalid format') || raw.includes('unable to validate email')) {
        friendly = 'Please enter a valid email address.';
      } else if (raw.includes('network') || raw.includes('failed to fetch')) {
        friendly = 'Network error. Please check your connection and try again.';
      }
      toast.error(friendly);
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <SEO
        title="Forgot Password"
        description="Reset your Z Agro Tech account password securely."
        url="/forgot-password"
        noIndex
      />
      <Card className="w-full max-w-md shadow-card rounded-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-display">Forgot Password</CardTitle>
          <CardDescription>
            {sent
              ? 'Check your email for the reset link'
              : 'Enter your email to receive a password reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4 bg-accent/5 rounded-xl p-6 shadow-card border border-accent/20">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-accent" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to:
                </p>
                <p className="font-medium break-all">{email}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-primary hover:underline font-medium"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    className={`pl-10 min-h-[44px] ${emailError ? 'border-destructive' : ''}`}
                    required
                    autoComplete="email"
                    autoFocus
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                  />
                </div>
                {emailError && (
                  <p id="email-error" className="text-xs text-destructive" role="alert">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
