import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Stethoscope, GraduationCap, FileText, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { DialogFooter } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ─── Schema ─────────────────────────────────────────────────────────────────
const noXSSRegex = /^[^<>]*$/;

const addDoctorSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255)
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  specialization: z.string().max(100).optional().or(z.literal('')),
  license_number: z.string().max(50).optional().or(z.literal('')),
  qualifications: z.array(z.string()).optional().default([]),
  experience_years: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (Number(val) >= 0 && Number(val) <= 60),
      'Experience must be between 0 and 60 years'
    ),
  consultation_fee: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (Number(val) >= 0 && Number(val) <= 100000),
      'Fee must be between 0 and 100,000'
    ),
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional().or(z.literal('')),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type AddDoctorFormValues = z.infer<typeof addDoctorSchema>;

// ─── Constants ──────────────────────────────────────────────────────────────
const SPECIALIZATIONS = [
  'General Veterinarian', 'Surgery', 'Dermatology', 'Cardiology',
  'Orthopedics', 'Dentistry', 'Oncology', 'Neurology',
  'Emergency Care', 'Exotic Animals', 'Farm Animals',
  'Internal Medicine', 'Ophthalmology', 'Radiology',
];

const COMMON_QUALIFICATIONS = ['DVM', 'BVSc', 'MVSc', 'PhD', 'MS', 'DACVS', 'DACVIM', 'DECVS'];

// ─── Steps config ───────────────────────────────────────────────────────────
const STEPS = [
  { title: 'Basic Info', description: 'Doctor name and contact', icon: User },
  { title: 'Specialization', description: 'Area of expertise', icon: Stethoscope },
  { title: 'Credentials', description: 'License and qualifications', icon: GraduationCap },
  { title: 'Bio', description: 'Professional summary', icon: FileText },
];

// ─── Props ──────────────────────────────────────────────────────────────────
interface AddDoctorWizardProps {
  onSubmit: (data: {
    name: string;
    email: string | null;
    phone: string | null;
    specialization: string | null;
    license_number: string | null;
    qualifications: string[] | null;
    experience_years: number | null;
    consultation_fee: number | null;
    bio: string | null;
    avatar_url: string | null;
  }) => Promise<void>;
  isPending: boolean;
  clinicName?: string;
  onCancel?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────
const AddDoctorWizard = ({ onSubmit, isPending, clinicName, onCancel }: AddDoctorWizardProps) => {
  const [step, setStep] = useState(0);

  const form = useForm<AddDoctorFormValues>({
    resolver: zodResolver(addDoctorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      specialization: '',
      license_number: '',
      qualifications: [],
      experience_years: '',
      consultation_fee: '',
      bio: '',
      avatar_url: '',
    },
    mode: 'onTouched',
  });

  const watchName = form.watch('name');
  const watchSpecialization = form.watch('specialization');
  const watchExperience = form.watch('experience_years');
  const watchFee = form.watch('consultation_fee');
  const watchQualifications = form.watch('qualifications') || [];
  const watchAvatarUrl = form.watch('avatar_url');
  const watchBio = form.watch('bio');

  // ── Phone formatter ────────────────────────────────────────────────────
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('880')) return '+' + digits;
    if (digits.startsWith('0')) return '+88' + digits;
    if (digits.length > 0 && !digits.startsWith('880')) return '+880' + digits;
    return value;
  };

  // ── Qualification toggle ───────────────────────────────────────────────
  const toggleQualification = (qual: string) => {
    const current = form.getValues('qualifications') || [];
    const next = current.includes(qual)
      ? current.filter(q => q !== qual)
      : [...current, qual];
    form.setValue('qualifications', next, { shouldValidate: true });
  };

  // ── Step navigation validation ─────────────────────────────────────────
  const canProceed = () => {
    if (step === 0) return (watchName || '').trim().length >= 2;
    return true; // Steps 1-3 are all optional fields
  };

  // ── Submit handler ─────────────────────────────────────────────────────
  const handleFormSubmit = async (values: AddDoctorFormValues) => {
    try {
      await onSubmit({
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        specialization: values.specialization || null,
        license_number: values.license_number || null,
        qualifications: (values.qualifications && values.qualifications.length > 0) ? values.qualifications : null,
        experience_years: values.experience_years ? parseInt(values.experience_years) : null,
        consultation_fee: values.consultation_fee ? parseFloat(values.consultation_fee) : null,
        bio: values.bio || null,
        avatar_url: values.avatar_url || null,
      });
      // Success toast is handled by the parent mutation's onSuccess
      // Reset form on success
      form.reset();
      setStep(0);
    } catch (error: any) {
      const message = error?.message || 'Failed to add doctor. Please try again.';
      toast.error(message);
    }
  };

  // ── Final submit (triggers RHF validation then submits) ────────────────
  const onLastStepSubmit = () => {
    form.handleSubmit(handleFormSubmit)();
  };

  return (
    <Form {...form}>
      <div className="w-full max-w-2xl mx-auto space-y-6 p-1 sm:p-2">

        {/* ── Progress Steps ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          {STEPS.map((s, index) => {
            const Icon = s.icon;
            const isActive = index === step;
            const isCompleted = index < step;
            return (
              <div key={index} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    'flex flex-col items-center gap-1.5 transition-all min-h-[44px] min-w-[44px]',
                    index <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {s.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2', index < step ? 'bg-primary' : 'bg-muted')} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step Content ──────────────────────────────────────────────── */}
        <div className="min-h-[280px]">

          {/* ─ Step 0: Basic Info ─ */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Profile picture */}
              <div className="space-y-3">
                <FormLabel className="text-base">Profile Picture</FormLabel>
                <div className="flex flex-col items-center gap-4">
                  {watchAvatarUrl ? (
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2 border-primary/20">
                        <AvatarImage src={watchAvatarUrl} alt="Doctor" className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {watchName ? watchName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 min-h-[44px] min-w-[44px] -m-2"
                        onClick={() => form.setValue('avatar_url', '')}
                      >
                        <span className="sr-only">Remove</span>×
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full max-w-xs">
                      <ImageUpload
                        value={watchAvatarUrl || ''}
                        onChange={(url) => form.setValue('avatar_url', url, { shouldValidate: true })}
                        bucket="avatars"
                        folder="doctors"
                        className="[&>div]:aspect-square [&>div]:max-w-[120px] [&>div]:mx-auto [&>div]:rounded-full"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-center">Upload a professional photo (recommended)</p>
                </div>
              </div>

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Doctor Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Dr. John Doe"
                        className="h-12 text-base"
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Full name as it will appear on the profile</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="doctor@example.com"
                          className="h-12 text-base"
                        />
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
                      <FormLabel className="text-base">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="+880 1XXX-XXXXXX"
                          className="h-12 text-base"
                          onChange={(e) => {
                            field.onChange(formatPhoneNumber(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* ─ Step 1: Specialization ─ */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Specialization</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {SPECIALIZATIONS.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => field.onChange(field.value === spec ? '' : spec)}
                          className={cn(
                            'px-3 py-3 rounded-lg border text-sm text-left transition-all min-h-[44px]',
                            field.value === spec
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border hover:border-primary/50 hover:bg-muted'
                          )}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="experience_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          max="60"
                          placeholder="5"
                          className="h-12 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consultation_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Consultation Fee (৳)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="500"
                          className="h-12 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* ─ Step 2: Credentials ─ */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="license_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">License Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="VET-XXXX-XXXX"
                        className="h-12 text-base"
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Bangladesh Veterinary Council registration number</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 pt-2">
                <FormLabel className="text-base">Qualifications</FormLabel>
                <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_QUALIFICATIONS.map((qual) => (
                    <Badge
                      key={qual}
                      variant={watchQualifications.includes(qual) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer px-3 py-2 text-sm transition-all min-h-[44px] flex items-center',
                        watchQualifications.includes(qual)
                          ? 'bg-primary hover:bg-primary/90'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => toggleQualification(qual)}
                    >
                      {watchQualifications.includes(qual) && <Check className="h-3 w-3 mr-1" />}
                      {qual}
                    </Badge>
                  ))}
                </div>
                {watchQualifications.length > 0 && (
                  <p className="text-sm text-primary mt-2">Selected: {watchQualifications.join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {/* ─ Step 3: Bio & Summary ─ */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Professional Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="A brief description about the doctor's experience, expertise, and approach to veterinary care..."
                        rows={5}
                        className="resize-none text-base"
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      {(watchBio || '').length}/2000 characters (optional)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Summary Preview */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14 border border-border shrink-0">
                    <AvatarImage src={watchAvatarUrl || undefined} alt="Doctor" className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {watchName ? watchName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'DR'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold truncate">{watchName || 'Doctor Name'}</p>
                    <p className="text-sm text-muted-foreground">
                      {watchSpecialization || 'General Veterinarian'}
                      {watchExperience && ` • ${watchExperience} years exp.`}
                    </p>
                    {watchFee && (
                      <p className="text-sm text-primary font-medium">৳{watchFee} per consultation</p>
                    )}
                    {watchQualifications.length > 0 && (
                      <p className="text-xs text-muted-foreground">{watchQualifications.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <div className="flex gap-2 w-full sm:w-auto">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 sm:flex-none h-12 min-h-[44px] text-base"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            {onCancel && step === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 sm:flex-none h-12 min-h-[44px] text-base"
              >
                Cancel
              </Button>
            )}
          </div>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 sm:flex-none h-12 min-h-[44px] text-base"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onLastStepSubmit}
              disabled={isPending || !canProceed()}
              className="flex-1 sm:flex-none h-12 min-h-[44px] min-w-[140px] text-base"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Add Doctor
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </div>
    </Form>
  );
};

export default AddDoctorWizard;
