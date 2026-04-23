import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { passwordSchema } from '@/lib/validations';
import { useAuthUser, useAuthLoading } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';
import PasswordStrengthHints from '@/components/auth/PasswordStrengthHints';

const RECOVERY_TIMEOUT_MS = 8000;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const user = useAuthUser();
  const authLoading = useAuthLoading();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Recovery session detection — handles both:
  //  1. AuthContext already captured the recovery session → user present.
  //  2. Hash present but listener still rotating → wait briefly, then time out.
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setSessionReady(true);
      return;
    }

    const hash = window.location.hash;
    const hasRecoveryToken = hash.includes('type=recovery') || hash.includes('access_token');
    if (!hasRecoveryToken) {
      setSessionError(true);
      return;
    }

    // Hash exists but no user yet — give the auth listener a window to fire.
    const timer = window.setTimeout(() => {
      // Re-check at timeout boundary; if still no user, mark as error.
      if (!supabase.auth.getSession) {
        setSessionError(true);
        return;
      }
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setSessionError(true);
      });
    }, RECOVERY_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [user, authLoading]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setValidationErrors({ password: passwordResult.error.errors[0]?.message || 'Invalid password' });
      return;
    }

    if (password !== confirmPassword) {
      setValidationErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const raw = (error.message || '').toLowerCase();
        if (
          raw.includes('session_not_found') ||
          raw.includes('expired') ||
          raw.includes('pgrst301') ||
          raw.includes('refresh_token') ||
          raw.includes('invalid token')
        ) {
          toast.error('Your recovery link has expired. Please request a new one.');
          setTimeout(() => navigate('/forgot-password'), 2000);
          return;
        }
        if (raw.includes('same as') || raw.includes('different from')) {
          setValidationErrors({ password: 'New password must be different from your current password.' });
          return;
        }
        throw error;
      }

      // Sign out the recovery session so the user must re-authenticate
      // with their new password — protects shared/public devices.
      await supabase.auth.signOut();

      setSuccess(true);
      toast.success('Password updated successfully');
      setTimeout(() => navigate('/auth'), 3000);
    } catch (error: any) {
      logger.error('Password update error:', error);
      toast.error(error?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, navigate]);

  // Loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  // Expired / invalid link state
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
        <SEO title="Link Expired" description="This password reset link is no longer valid." url="/reset-password" noIndex />
        <Card className="w-full max-w-md shadow-card rounded-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl font-display">Link Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4 bg-destructive/5 rounded-xl p-6 shadow-card border border-destructive/20">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Invalid or Expired Link</p>
                <p className="text-sm text-muted-foreground">
                  This password reset link is no longer valid. Please request a new one.
                </p>
              </div>
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full min-h-[44px]"
              >
                Request New Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <SEO
        title="Reset Password"
        description="Set a new password for your Z Agro Tech account."
        url="/reset-password"
        noIndex
      />
      <Card className="w-full max-w-md shadow-card rounded-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-display">Reset Password</CardTitle>
          <CardDescription>
            {success
              ? 'Your password has been updated'
              : 'Enter your new password below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4 bg-accent/5 rounded-xl p-6 shadow-card border border-accent/20">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-accent" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Password Updated!</p>
                <p className="text-sm text-muted-foreground">
                  Sign in with your new password to continue. Redirecting...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setValidationErrors((prev) => ({ ...prev, password: '' })); }}
                    className={`pl-10 pr-12 min-h-[44px] ${validationErrors.password ? 'border-destructive' : ''}`}
                    required
                    autoComplete="new-password"
                    autoFocus
                    aria-invalid={!!validationErrors.password}
                    aria-describedby={validationErrors.password ? 'password-error' : 'password-hints'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password ? (
                  <p id="password-error" className="text-xs text-destructive" role="alert">{validationErrors.password}</p>
                ) : (
                  <div id="password-hints">
                    <PasswordStrengthHints password={password} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setValidationErrors((prev) => ({ ...prev, confirmPassword: '' })); }}
                    className={`pl-10 pr-12 min-h-[44px] ${validationErrors.confirmPassword ? 'border-destructive' : ''}`}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!validationErrors.confirmPassword}
                    aria-describedby={validationErrors.confirmPassword ? 'confirm-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p id="confirm-error" className="text-xs text-destructive" role="alert">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={loading || !sessionReady || !password || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Updating...
                  </>
                ) : !sessionReady ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Verifying link...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
