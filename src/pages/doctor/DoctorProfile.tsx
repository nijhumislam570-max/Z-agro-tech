import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2, Camera, ExternalLink, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctor } from '@/hooks/useDoctor';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { safeMutation } from '@/lib/supabaseService';
import { compressImage } from '@/lib/mediaCompression';
import { doctorFormSchema, type DoctorFormSchemaData } from '@/lib/validations';

const COMMON_QUALIFICATIONS = [
  'DVM', 'BVSc', 'MVSc', 'PhD', 'DACVS', 'DACVIM', 'DECVS', 'MRCVS'
];

const DoctorProfile = () => {
  useDocumentTitle('Edit Profile');
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const { doctorProfile, profileLoading, updateProfile } = useDoctor();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newQualification, setNewQualification] = useState('');

  const form = useForm<DoctorFormSchemaData>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: '',
      specialization: '',
      bio: '',
      phone: '',
      email: '',
      license_number: '',
      experience_years: '',
      consultation_fee: '',
      qualifications: [],
    },
  });

  // Populate form when doctor profile loads
  useEffect(() => {
    if (doctorProfile) {
      form.reset({
        name: doctorProfile.name || '',
        specialization: doctorProfile.specialization || '',
        bio: doctorProfile.bio || '',
        phone: doctorProfile.phone || '',
        email: doctorProfile.email || '',
        license_number: doctorProfile.license_number || '',
        experience_years: doctorProfile.experience_years?.toString() || '',
        consultation_fee: doctorProfile.consultation_fee?.toString() || '',
        qualifications: doctorProfile.qualifications || [],
      });
    }
  }, [doctorProfile, form]);

  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (doctorProfile) {
      setIsAvailable(doctorProfile.is_available ?? true);
    }
  }, [doctorProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doctorProfile?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      // Compress with avatar preset (400px max)
      const compressed = await compressImage(file, 'avatar');
      const processedFile = compressed.file;

      const fileExt = processedFile.name.split('.').pop() || 'jpg';
      const filePath = `doctors/${doctorProfile.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, processedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await safeMutation(
        supabase.from('doctors').update({ avatar_url: publicUrl }).eq('id', doctorProfile.id).select().single() as any,
        { successMsg: 'Profile photo updated!', errorMsg: 'Failed to upload photo' }
      );

      // Refresh profile data
      updateProfile.reset();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const qualifications = form.watch('qualifications') || [];

  const addQualification = (qual: string) => {
    if (qual && !qualifications.includes(qual)) {
      form.setValue('qualifications', [...qualifications, qual]);
    }
    setNewQualification('');
  };

  const removeQualification = (qual: string) => {
    form.setValue('qualifications', qualifications.filter(q => q !== qual));
  };

  const onSubmit = async (data: DoctorFormSchemaData) => {
    await safeMutation(
      supabase.from('doctors').update({
        name: data.name,
        specialization: data.specialization || null,
        bio: data.bio || null,
        phone: data.phone || null,
        email: data.email || null,
        license_number: data.license_number || null,
        experience_years: data.experience_years ? parseInt(data.experience_years) : null,
        consultation_fee: data.consultation_fee ? parseFloat(data.consultation_fee) : null,
        is_available: isAvailable,
        qualifications: (data.qualifications?.length ?? 0) > 0 ? data.qualifications : null,
      }).eq('id', doctorProfile!.id).select().single() as any,
      { successMsg: 'Profile updated successfully', errorMsg: 'Failed to update profile' }
    );
  };

  if (roleLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isDoctor) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-3 gap-1.5 -ml-1" onClick={() => navigate('/doctor/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Profile Photo */}
            <Card>
              <CardContent className="pt-5 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                      <AvatarImage src={doctorProfile?.avatar_url || ''} />
                      <AvatarFallback className="text-xl sm:text-2xl">
                        {form.watch('name')?.charAt(0) || 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                      aria-label="Upload profile photo"
                    >
                      {avatarUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                      <h2 className="text-lg sm:text-xl font-semibold truncate">{form.watch('name') || 'Doctor Profile'}</h2>
                      {doctorProfile?.is_verified && (
                        <Badge variant="default" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{form.watch('specialization') || 'Veterinary Doctor'}</p>
                    {doctorProfile?.id && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto mt-1.5 text-xs" 
                        onClick={() => navigate(`/doctor/${doctorProfile.id}`)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Public Profile
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your professional details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialization</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Small Animals, Surgery" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell patients about yourself..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="license_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Qualifications */}
            <Card>
              <CardHeader>
                <CardTitle>Qualifications</CardTitle>
                <CardDescription>Add your degrees and certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {qualifications.map((qual) => (
                    <Badge key={qual} variant="secondary" className="text-sm px-3 py-1.5 gap-1">
                      {qual}
                      <button
                        type="button"
                        onClick={() => removeQualification(qual)}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${qual}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Common Qualifications</Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_QUALIFICATIONS.filter(q => !qualifications.includes(q)).map((qual) => (
                      <Button
                        key={qual}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addQualification(qual)}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {qual}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom qualification..."
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addQualification(newQualification);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addQualification(newQualification)}
                    disabled={!newQualification}
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Availability & Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Availability & Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Available for Appointments</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle off when you're unavailable
                    </p>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="consultation_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation Fee (BDT)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Form>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default DoctorProfile;