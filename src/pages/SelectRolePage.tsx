import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Stethoscope, Loader2, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.jpeg';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type SelectableRole = 'user' | 'doctor' | 'clinic_owner';

const roles = [
  {
    id: 'user' as SelectableRole,
    title: 'Pet Parent',
    description: 'I have pets and want to connect, shop, and book appointments',
    icon: User,
  },
  {
    id: 'doctor' as SelectableRole,
    title: 'Veterinary Doctor',
    description: 'I am a licensed veterinarian looking to practice',
    icon: Stethoscope,
  },
  {
    id: 'clinic_owner' as SelectableRole,
    title: 'Clinic Owner',
    description: 'I own or manage a veterinary clinic',
    icon: Building2,
  },
];

const SelectRolePage = () => {
  useDocumentTitle('Complete Your Profile');
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshSession } = useAuth();
  
  
  const [selectedRole, setSelectedRole] = useState<SelectableRole>('user');
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Clinic owner fields
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');

  // Disable browser back button to prevent bypassing role selection
  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  // Priority order for role-based redirects
  const ROLE_PRIORITY = ['admin', 'clinic_owner', 'doctor', 'user'];

  const redirectBasedOnRoles = (roles: string[], isNewClinicOwner = false) => {
    const primaryRole = ROLE_PRIORITY.find(r => roles.includes(r)) || 'user';
    
    switch (primaryRole) {
      case 'admin':
        navigate('/admin');
        break;
      case 'clinic_owner':
        if (isNewClinicOwner) {
          navigate('/clinic/verification');
        } else {
          navigate('/clinic/dashboard');
        }
        break;
      case 'doctor':
        navigate('/doctor/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  // Check if user already has any roles
  useEffect(() => {
    const checkExistingRoles = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        setError(null);
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (roleError) {
          logger.error('Error checking roles:', roleError);
          setError('Failed to check your account status. Please try again.');
          setCheckingRole(false);
          return;
        }

        const roles = roleData?.map(r => r.role) || [];

        if (roles.length > 0) {
          // User already has role(s), redirect based on priority
          redirectBasedOnRoles(roles);
        } else {
          setCheckingRole(false);
        }
      } catch (err) {
        logger.error('Error in role check:', err);
        setError('An unexpected error occurred. Please try again.');
        setCheckingRole(false);
      }
    };

    if (!authLoading) {
      checkExistingRoles();
    }
  }, [user, authLoading, retryCount]);

  const handleRetry = () => {
    setCheckingRole(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check if user already has any roles (prevent duplicate)
      const { data: existingRoles, error: checkError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (checkError) {
        throw new Error('Failed to verify your account. Please try again.');
      }

      const currentRoles = existingRoles?.map(r => r.role) || [];

      if (currentRoles.length > 0) {
        // User already has role(s), just redirect
        toast.success('Your account is ready. Redirecting...');
        redirectBasedOnRoles(currentRoles);
        return;
      }

      // Create role entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: selectedRole,
        });

      if (roleError) {
        logger.error('Failed to assign role:', roleError);
        
        // Check if it's a unique constraint violation (role already exists)
        if (roleError.code === '23505') {
          // Role already exists, fetch all and redirect
          const { data: updatedRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          const roles = updatedRoles?.map(r => r.role) || [];
          if (roles.length > 0) {
            toast.success('Your account is ready. Redirecting...');
            redirectBasedOnRoles(roles);
            return;
          }
        }
        
        throw new Error('Failed to set up your account. Please try again.');
      }

      // If clinic owner, create the clinic
      if (selectedRole === 'clinic_owner') {
        if (!clinicName.trim()) {
          throw new Error('Clinic name is required');
        }

        const { error: clinicError } = await supabase
          .from('clinics')
          .insert({
            name: clinicName,
            address: clinicAddress || null,
            phone: clinicPhone || null,
            owner_user_id: user.id,
            is_open: true,
            rating: 0,
          });

        if (clinicError) {
          logger.error('Failed to create clinic:', clinicError);
          toast.warning('Account created, but there was an issue creating your clinic. Please set it up in your dashboard.');
        }
      }

      // If doctor, create doctor profile
      if (selectedRole === 'doctor') {
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Doctor';
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            name: userName,
            user_id: user.id,
            is_available: true,
            is_verified: false,
            verification_status: 'not_submitted',
          });

        if (doctorError && doctorError.code !== '23505') {
          logger.error('Failed to create doctor profile:', doctorError);
          toast.warning('Account created, but there was an issue creating your doctor profile. Complete this on the verification page.');
        }
      }

      // Refresh session so AuthContext picks up new role immediately
      await refreshSession();

      toast.success(selectedRole === 'clinic_owner' 
          ? 'Welcome to VET-MEDIX! Please complete verification.' 
          : selectedRole === 'doctor'
          ? 'Welcome to VET-MEDIX! Please complete verification.'
          : 'Welcome to VET-MEDIX! Your account is ready.');

      // CRITICAL: Priority redirection after role selection
      switch (selectedRole) {
        case 'doctor':
          navigate('/doctor/verification', { replace: true });
          break;
        case 'clinic_owner':
          navigate('/clinic/verification', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      logger.error('Setup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete setup';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // BUG-2 fix: redirect in useEffect, not during render
  useEffect(() => {
    if (!authLoading && !checkingRole && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, checkingRole, navigate]);

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logo} 
              alt="VET-MEDIX" 
              className="h-16 w-16 rounded-xl object-contain bg-white shadow-soft border border-border/30"
              loading="eager"
              decoding="async"
              width={64}
              height={64}
            />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a...</Label>
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left min-h-[60px]',
                      'hover:border-primary/50 hover:bg-primary/5 hover:shadow-hover active:scale-[0.98]',
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-card'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}>
                        {role.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {role.description}
                      </p>
                    </div>
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clinic Owner Fields */}
            {selectedRole === 'clinic_owner' && (
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground pt-2">
                  Enter your clinic details to get started
                </p>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name *</Label>
                  <Input
                    id="clinicName"
                    type="text"
                    placeholder="Your clinic's name"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Clinic Address</Label>
                  <Input
                    id="clinicAddress"
                    type="text"
                    placeholder="Full address of your clinic"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone">Clinic Phone</Label>
                  <Input
                    id="clinicPhone"
                    type="tel"
                    placeholder="Contact number"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectRolePage;
