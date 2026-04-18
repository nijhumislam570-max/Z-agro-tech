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
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { passwordSchema } from '@/lib/validations';
import { useAuth } from '@/contexts/AuthContext';

const ResetPasswordPage = () => {
  useDocumentTitle('Reset Password');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Wait for the recovery session from the URL hash to be captured by AuthContext
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setSessionReady(true);
    } else {
      // Check if the URL has a recovery hash — if not, session is truly missing
      const hash = window.location.hash;
      const hasRecoveryToken = hash.includes('type=recovery') || hash.includes('access_token');
      if (!hasRecoveryToken) {
        setSessionError(true);
      }
      // If hash exists but user not yet set, wait for auth state change
    }
  }, [user, authLoading]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate password with Zod
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
        // Handle expired recovery link
        if (
          error.message?.includes('session_not_found') ||
          error.message?.includes('expired') ||
          error.message?.includes('PGRST301') ||
          error.message?.includes('refresh_token')
        ) {
          toast.error('Your recovery link has expired. Please request a new one.');
          setTimeout(() => navigate('/forgot-password'), 2000);
          return;
        }
        throw error;
      }

      setSuccess(true);
      toast.success('Password updated successfully');
      
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error: any) {
      logger.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, navigate]);

  // Loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Expired / invalid link state
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
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
                <AlertTriangle className="h-8 w-8 text-destructive" />
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
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Password Updated!</p>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to the login page shortly...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setValidationErrors(prev => ({ ...prev, password: '' })); }}
                    className={`pl-10 pr-10 min-h-[44px] ${validationErrors.password ? 'border-destructive' : ''}`}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!validationErrors.password}
                    aria-describedby={validationErrors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center -mr-3"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p id="password-error" className="text-xs text-destructive" role="alert">{validationErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setValidationErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                    className={`pl-10 min-h-[44px] ${validationErrors.confirmPassword ? 'border-destructive' : ''}`}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!validationErrors.confirmPassword}
                    aria-describedby={validationErrors.confirmPassword ? 'confirm-error' : undefined}
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p id="confirm-error" className="text-xs text-destructive" role="alert">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full min-h-[44px]" disabled={loading || !sessionReady}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : !sessionReady ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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