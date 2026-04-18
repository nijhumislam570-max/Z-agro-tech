import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Loader2, Sprout, GraduationCap, Truck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import logo from '@/assets/zagrotech-logo.jpeg';
import { loginSchema, signupSchema } from '@/lib/validations';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const AuthPage = () => {
  useDocumentTitle('Sign In');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = activeTab === 'signin';
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const redirectAfterAuth = useCallback(async (userId: string) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const isAdmin = roleData?.some((r: { role: string }) => r.role === 'admin') ?? false;
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else {
      navigate(fromPath || '/dashboard', { replace: true });
    }
  }, [navigate, fromPath]);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (authLoading) return;
      if (user) {
        await redirectAfterAuth(user.id);
      } else {
        setCheckingAuth(false);
      }
    };
    handleAuthCallback();
  }, [user, authLoading, redirectAfterAuth]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('apple', { redirect_uri: window.location.origin });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in with Apple");
      setAppleLoading(false);
    }
  };

  const validateForm = (): boolean => {
    setValidationErrors({});
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, fullName });
      }
      return true;
    } catch (error: any) {
      if (error.errors) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const path = err.path[0];
          if (path && !errors[path]) errors[path] = err.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          toast.success("Welcome back to Z Agro Tech!");
          await redirectAfterAuth(currentUser.id);
        }
      } else {
        const { error, user: newUser } = await signUp(email, password, fullName);
        if (error) throw error;
        if (!newUser) throw new Error('Failed to create account. Please try again.');
        toast.success("Welcome to Z Agro Tech!");
        await redirectAfterAuth(newUser.id);
      }
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : "Something went wrong";
      const friendlyMessages: Record<string, string> = {
        'User already registered': 'An account with this email already exists. Please sign in instead.',
        'Invalid login credentials': 'Incorrect email or password. Please try again.',
        'Email not confirmed': 'Please verify your email address before signing in.',
        'Too many requests': 'Too many attempts. Please wait a moment and try again.',
        'Signup disabled': 'New registrations are currently disabled. Please contact support.',
      };
      const friendlyMessage = Object.entries(friendlyMessages).find(
        ([key]) => rawMessage.toLowerCase().includes(key.toLowerCase())
      )?.[1] || rawMessage;
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setValidationErrors({});
  };

  if (authLoading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking session…</p>
        </div>
      </div>
    );
  }

  const anyLoading = loading || googleLoading || appleLoading;

  return (
    <main id="main-content" className="min-h-screen flex flex-col md:flex-row">
      {/* ─── Left Branding Panel ─── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent flex-col justify-between p-8 lg:p-12">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-sunshine/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl animate-pulse-slow" />

        {/* Top - Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src={logo}
              alt="Z Agro Tech"
              className="h-12 w-12 rounded-2xl object-contain bg-white/95 shadow-lg border-2 border-white/30 group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-display font-bold text-white drop-shadow-sm">
              Z AGRO TECH
            </span>
          </Link>
        </div>

        {/* Center - Feature highlights */}
        <div className="relative z-10 space-y-8 my-auto max-w-md">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white leading-tight">
            Grow smarter with<br />
            <span className="text-sunshine">Z Agro Tech</span>
          </h2>
          <p className="text-white/80 text-base lg:text-lg leading-relaxed">
            Bangladesh's premium hub for verified agri-inputs and the Smart Farming Academy.
          </p>

          <div className="space-y-4">
            {[
              { icon: Sprout, text: "Premium seeds, fertilizers & crop-protection" },
              { icon: GraduationCap, text: "Live masterclasses from agronomy experts" },
              { icon: Truck, text: "Fast nationwide delivery, COD available" },
              { icon: ShieldCheck, text: "Quality-tested, traceable supply chain" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white/90 text-sm lg:text-base">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom - Trust */}
        <div className="relative z-10 pt-6 border-t border-white/15">
          <p className="text-white/50 text-xs">
            © {new Date().getFullYear()} Z Agro Tech — Shop · Academy · Krishi Clinic
          </p>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center bg-agri-gradient p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen md:min-h-0 overflow-y-auto relative">
        {/* Soft decorative blobs over agri gradient */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-sunshine/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10">
          {/* Mobile header - visible only on small screens */}
          <div className="md:hidden flex flex-col items-center mb-6">
            <Link to="/" className="inline-flex items-center gap-3 group mb-3">
              <img
                src={logo}
                alt="Z Agro Tech"
                className="h-14 w-14 rounded-2xl object-contain bg-white shadow-soft border border-white/40"
              />
            </Link>
            <h1 className="text-2xl font-display font-bold text-white drop-shadow">Z Agro Tech</h1>
            <p className="text-white/85 text-sm mt-0.5">Premium Agri-Inputs · Smart Farming Academy</p>
          </div>

          {/* Desktop header */}
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white drop-shadow">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-white/85 mt-1.5">
              {isLogin
                ? 'Sign in to your Z Agro Tech dashboard'
                : 'Join Z Agro Tech — agri-inputs & masterclasses'}
            </p>
          </div>

          {/* ─── Glass card over agri gradient ─── */}
          <div className="backdrop-blur-xl bg-white/85 dark:bg-card/80 border border-white/40 rounded-2xl shadow-2xl p-5 sm:p-7 transition-all duration-200">
            <Tabs
              value={activeTab}
              onValueChange={(v) => { setActiveTab(v as 'signin' | 'signup'); resetForm(); }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 h-11 bg-muted/70">
                <TabsTrigger value="signin" className="text-sm font-semibold data-[state=active]:shadow-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-sm font-semibold data-[state=active]:shadow-sm">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* ─── SIGN IN ─── */}
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      aria-invalid={!!validationErrors.email}
                      className={`h-11 ${validationErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-destructive" role="alert">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        aria-invalid={!!validationErrors.password}
                        className={`h-11 pr-11 ${validationErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-destructive" role="alert">{validationErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-11 font-semibold" disabled={anyLoading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* ─── SIGN UP ─── */}
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                      aria-invalid={!!validationErrors.fullName}
                      className={`h-11 ${validationErrors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {validationErrors.fullName && (
                      <p className="text-xs text-destructive" role="alert">{validationErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      aria-invalid={!!validationErrors.email}
                      className={`h-11 ${validationErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-destructive" role="alert">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        aria-invalid={!!validationErrors.password}
                        className={`h-11 pr-11 ${validationErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-destructive" role="alert">{validationErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-11 font-semibold" disabled={anyLoading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* ─── OAuth Divider ─── */}
            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/80 px-3 text-xs text-muted-foreground">
                or continue with
              </span>
            </div>

            {/* ─── Social Buttons ─── */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 text-sm font-medium"
                onClick={handleGoogleSignIn}
                disabled={anyLoading}
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 hover:text-background border-foreground"
                onClick={handleAppleSignIn}
                disabled={anyLoading}
              >
                {appleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
                Apple
              </Button>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthPage;
