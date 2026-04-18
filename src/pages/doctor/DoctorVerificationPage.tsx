import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Upload, FileCheck, AlertCircle, Clock, 
  CheckCircle, XCircle, Loader2, Shield, FileText, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getStatusColor } from '@/lib/statusColors';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctor } from '@/hooks/useDoctor';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { createAdminNotification } from '@/lib/notifications';
import { validateDocumentFile, removeStorageFiles } from '@/lib/storageUtils';
import { doctorVerificationSchema } from '@/lib/validations';
import { DoctorVerificationSkeleton } from '@/components/doctor/DoctorVerificationSkeleton';

const DoctorVerificationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const { doctorProfile, profileLoading, updateProfile } = useDoctor();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    nid_number: '',
    license_number: '',
    specialization: '',
    experience_years: '',
    bio: '',
  });

  const [bvcCertificate, setBvcCertificate] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);

  useEffect(() => {
    if (doctorProfile) {
      setFormData({
        name: doctorProfile.name || '',
        nid_number: (doctorProfile as Record<string, any>).nid_number || '',
        license_number: doctorProfile.license_number || '',
        specialization: doctorProfile.specialization || '',
        experience_years: doctorProfile.experience_years?.toString() || '',
        bio: doctorProfile.bio || '',
      });
    }
  }, [doctorProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateDocumentFile(file);
      if (error) {
        toast.error(error);
        e.target.value = '';
        return;
      }
      setBvcCertificate(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !doctorProfile) return;

    // Validate with Zod schema
    const result = doctorVerificationSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'Please fix form errors');
      return;
    }

    if (!bvcCertificate && !(doctorProfile as Record<string, any>).bvc_certificate_url) {
      toast.error('Please upload your BVC certificate');
      return;
    }

    setSubmitting(true);

    try {
      let bvcCertificateUrl = (doctorProfile as Record<string, any>).bvc_certificate_url;

      // Upload BVC certificate if new file selected
      if (bvcCertificate) {
        setUploading(true);

        // Clean up old file if exists (handle extension change orphans)
        if (bvcCertificateUrl) {
          await removeStorageFiles([bvcCertificateUrl], 'doctor-documents');
        }

        const fileExt = bvcCertificate.name.split('.').pop();
        const fileName = `${user.id}/bvc_certificate_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('doctor-documents')
          .upload(fileName, bvcCertificate);

        if (uploadError) throw uploadError;

        // Store the storage path for private bucket (not public URL)
        bvcCertificateUrl = fileName;
        setUploading(false);
      }

      // Update doctor profile with verification data
      const { error } = await supabase
        .from('doctors')
        .update({
          name: formData.name,
          nid_number: formData.nid_number,
          license_number: formData.license_number,
          specialization: formData.specialization || null,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          bio: formData.bio || null,
          bvc_certificate_url: bvcCertificateUrl,
          verification_status: 'pending',
          verification_submitted_at: new Date().toISOString(),
        })
        .eq('id', doctorProfile.id);

      if (error) throw error;

      // Notify all admins about new verification request
      await createAdminNotification({
        type: 'new_verification',
        title: '🩺 New Doctor Verification Request',
        message: `Dr. ${formData.name} has submitted a verification request for review.`,
      });

      toast.success('Verification submitted successfully! We will review your documents shortly.');
      navigate('/doctor/dashboard');
    } catch (error: any) {
      logger.error('Verification error:', error);
      toast.error('Failed to submit verification. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (roleLoading || profileLoading) {
    return <DoctorVerificationSkeleton />;
  }

  // Handle case where doctor profile doesn't exist yet
  const handleCreateProfile = async () => {
    if (!user) return;
    setCreatingProfile(true);
    try {
      const { error } = await supabase
        .from('doctors')
        .insert({
          name: user.email?.split('@')[0] || 'Doctor',
          user_id: user.id,
          is_available: true,
          is_verified: false,
          verification_status: 'not_submitted',
        });

      if (error && error.code !== '23505') throw error;
      
      toast.success('Doctor profile created! You can now submit your verification.');
      // Re-fetch doctor profile without full page reload
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
    } catch (error: any) {
      logger.error('Failed to create doctor profile:', error);
      toast.error('Failed to create doctor profile. Please try again.');
    } finally {
      setCreatingProfile(false);
    }
  };

  if (!isDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              This page is only accessible to registered doctors.
            </p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is a doctor but no profile exists, offer to create one
  if (!doctorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Stethoscope className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Complete Your Setup</h2>
            <p className="text-muted-foreground mb-4">
              Your doctor profile wasn't created during signup. Let's fix that!
            </p>
            <Button 
              onClick={handleCreateProfile} 
              disabled={creatingProfile}
              className="w-full"
            >
              {creatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Create Doctor Profile'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verificationStatus = (doctorProfile as Record<string, any>)?.verification_status || 'not_submitted';

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Submitted
          </Badge>
        );
    }
  };

  const getProgress = () => {
    let progress = 0;
    if (formData.name) progress += 15;
    if (formData.nid_number) progress += 20;
    if (formData.license_number) progress += 20;
    if (formData.specialization) progress += 10;
    if (formData.experience_years) progress += 10;
    if (formData.bio) progress += 10;
    if (bvcCertificate || (doctorProfile as Record<string, any>)?.bvc_certificate_url) progress += 15;
    return progress;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-20 md:pb-0">
      <Navbar />

      <main id="main-content" className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => navigate('/doctor/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Doctor Verification
            </h1>
            <p className="text-sm text-muted-foreground">
              Submit your credentials for review
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Status Pipeline Tracker */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {(['not_submitted', 'pending', 'approved'] as const).map((step, idx) => {
                const isActive = verificationStatus === step || (step === 'approved' && verificationStatus === 'rejected');
                const isPast =
                  (step === 'not_submitted' && verificationStatus !== 'not_submitted') ||
                  (step === 'pending' && (verificationStatus === 'approved' || verificationStatus === 'rejected'));
                const displayLabel = step === 'approved' && verificationStatus === 'rejected' ? 'Rejected' : step.replace('_', ' ');
                const statusForColor = step === 'approved' && verificationStatus === 'rejected' ? 'rejected' : step === 'not_submitted' ? 'pending' : step === 'approved' ? 'completed' : step;

                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPast ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      isActive ? getStatusColor(statusForColor) :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isPast ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium capitalize text-center leading-tight">{displayLabel}</span>
                    {idx < 2 && (
                      <div className={`absolute hidden`} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Connector lines */}
            <div className="flex items-center mt-[-2.25rem] mb-6 px-[16.67%]">
              <div className={`flex-1 h-0.5 ${verificationStatus !== 'not_submitted' ? 'bg-green-500' : 'bg-border'}`} />
              <div className={`flex-1 h-0.5 ${verificationStatus === 'approved' ? 'bg-green-500' : verificationStatus === 'rejected' ? 'bg-destructive' : 'bg-border'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {verificationStatus === 'pending' && (
          <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">Verification in Progress</p>
                  <p className="text-sm text-yellow-600/80 dark:text-yellow-300/70">
                    Your documents are being reviewed. This usually takes 1-2 business days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationStatus === 'rejected' && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Verification Rejected</AlertTitle>
            <AlertDescription>
              {(doctorProfile as Record<string, any>)?.rejection_reason || 'Your verification was rejected. Please resubmit with valid documents.'}
            </AlertDescription>
          </Alert>
        )}

        {verificationStatus === 'approved' && (
          <Card className="mb-6 border-green-500/30 bg-green-500/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Verified Doctor</p>
                  <p className="text-sm text-green-600/80 dark:text-green-300/70">
                    Your profile is verified and visible on the doctors listing page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        {verificationStatus !== 'approved' && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-sm text-muted-foreground">{getProgress()}%</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your identity details for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Dr. John Doe"
                  required
                  disabled={verificationStatus === 'approved'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nid">National ID Number *</Label>
                <Input
                  id="nid"
                  value={formData.nid_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, nid_number: e.target.value }))}
                  placeholder="Enter your NID number"
                  required
                  disabled={verificationStatus === 'approved'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">BVC License Number *</Label>
                <Input
                  id="license"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  placeholder="VET-XXXX-XXXX"
                  required
                  disabled={verificationStatus === 'approved'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  placeholder="e.g., Surgery, Dermatology"
                  disabled={verificationStatus === 'approved'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                  placeholder="e.g., 5"
                  disabled={verificationStatus === 'approved'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief description about your experience and expertise..."
                  rows={4}
                  disabled={verificationStatus === 'approved'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Verification Documents
              </CardTitle>
              <CardDescription>
                Upload your BVC certificate for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  {(doctorProfile as Record<string, any>)?.bvc_certificate_url || bvcCertificate ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileCheck className="h-8 w-8 text-green-500" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">
                          {bvcCertificate?.name || 'BVC Certificate Uploaded'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {bvcCertificate ? 'Ready to upload' : 'Previously uploaded'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload your BVC certificate (PDF, JPG, PNG - max 5MB)
                      </p>
                    </>
                  )}
                  
                  {verificationStatus !== 'approved' && (
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      className="max-w-xs mx-auto"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {verificationStatus !== 'approved' && (
            <Button
              type="submit"
              className="w-full rounded-xl h-12"
              disabled={submitting || uploading}
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Submitting...'}
                </>
              ) : verificationStatus === 'pending' ? (
                'Update Submission'
              ) : (
                'Submit for Verification'
              )}
            </Button>
          )}
        </form>
      </main>

      <MobileNav />
    </div>
  );
};

export default DoctorVerificationPage;
