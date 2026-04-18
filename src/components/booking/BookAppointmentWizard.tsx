import { useState, useEffect, useMemo } from 'react';
import { Loader2, User, Calendar, Clock, PawPrint, FileText, Check, ChevronRight, ChevronLeft, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { appointmentSchema } from '@/lib/validations';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Doctor {
  id: string;
  name: string;
  avatar_url?: string;
  specialization?: string;
  schedules?: any[];
}

interface AppointmentFormData {
  doctorId: string;
  date: string;
  time: string;
  petName: string;
  petType: string;
  reason: string;
}

const initialFormData: AppointmentFormData = {
  doctorId: '',
  date: '',
  time: '',
  petName: '',
  petType: '',
  reason: '',
};

const PET_TYPES = [
  { value: 'Dog', icon: '🐕', label: 'Dog' },
  { value: 'Cat', icon: '🐈', label: 'Cat' },
  { value: 'Bird', icon: '🐦', label: 'Bird' },
  { value: 'Cattle', icon: '🐄', label: 'Cattle' },
  { value: 'Goat', icon: '🐐', label: 'Goat' },
  { value: 'Sheep', icon: '🐑', label: 'Sheep' },
  { value: 'Rabbit', icon: '🐇', label: 'Rabbit' },
  { value: 'Fish', icon: '🐟', label: 'Fish' },
  { value: 'Other', icon: '🐾', label: 'Other' },
];

const DEFAULT_TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

interface BookAppointmentWizardProps {
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  isPending: boolean;
  doctors: Doctor[];
  onCancel?: () => void;
  clinicName?: string;
  clinicId?: string;
  preSelectedDoctorId?: string;
}

const BookAppointmentWizard = ({ onSubmit, isPending, doctors, onCancel, clinicName, clinicId, preSelectedDoctorId }: BookAppointmentWizardProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<AppointmentFormData>(() => ({
    ...initialFormData,
    doctorId: preSelectedDoctorId || '',
  }));
  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  // Fetch already-booked slots for selected date + doctor to prevent double booking
  useEffect(() => {
    if (!formData.date || !clinicId) {
      setBookedSlots(new Set());
      return;
    }

    const fetchBookedSlots = async () => {
      let query = supabase
        .from('appointments')
        .select('appointment_time')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', formData.date)
        .in('status', ['pending', 'confirmed']);

      if (formData.doctorId) {
        query = query.eq('doctor_id', formData.doctorId);
      }

      const { data } = await query;
      setBookedSlots(new Set(data?.map(a => a.appointment_time) || []));
    };

    fetchBookedSlots();
  }, [formData.date, formData.doctorId, clinicId]);

  // Filter out booked slots from available ones
  const displaySlots = useMemo(() => 
    availableSlots.filter(slot => !bookedSlots.has(slot)),
    [availableSlots, bookedSlots]
  );

  // Set pre-selected doctor if provided and exists in doctors list
  useEffect(() => {
    if (preSelectedDoctorId && doctors.some(d => d.id === preSelectedDoctorId)) {
      setFormData(prev => ({ ...prev, doctorId: preSelectedDoctorId }));
    }
  }, [preSelectedDoctorId, doctors]);

  const steps = [
    { 
      title: 'Pet Info', 
      description: 'Your pet details',
      icon: PawPrint,
      fields: ['petName', 'petType']
    },
    { 
      title: 'Doctor', 
      description: 'Select a doctor',
      icon: Stethoscope,
      fields: ['doctorId']
    },
    { 
      title: 'Schedule', 
      description: 'Pick date & time',
      icon: Calendar,
      fields: ['date', 'time']
    },
    { 
      title: 'Details', 
      description: 'Reason for visit',
      icon: FileText,
      fields: ['reason']
    },
  ];

  const handleInputChange = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Update available slots when doctor or date changes
  useEffect(() => {
    if (!formData.date) {
      setAvailableSlots(DEFAULT_TIME_SLOTS);
      return;
    }

    if (!formData.doctorId) {
      // Check if any doctor has schedules
      const allDoctorsHaveSchedules = doctors.some(d => d.schedules && d.schedules.length > 0);
      if (!allDoctorsHaveSchedules) {
        setAvailableSlots(DEFAULT_TIME_SLOTS);
        return;
      }

      const selectedDate = new Date(formData.date);
      const dayOfWeek = selectedDate.getDay();
      
      const allSlots = new Set<string>();
      doctors.forEach(doctor => {
        if (doctor.schedules && doctor.schedules.length > 0) {
          doctor.schedules
            .filter((s: any) => s.day_of_week === dayOfWeek && s.is_available)
            .forEach((s: any) => allSlots.add(s.start_time));
        }
      });

      setAvailableSlots(allSlots.size > 0 ? Array.from(allSlots).sort() : DEFAULT_TIME_SLOTS);
      return;
    }

    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
    if (!selectedDoctor?.schedules?.length) {
      setAvailableSlots(DEFAULT_TIME_SLOTS);
      return;
    }

    const selectedDate = new Date(formData.date);
    const dayOfWeek = selectedDate.getDay();
    
    const daySchedules = selectedDoctor.schedules.filter(
      (s: any) => s.day_of_week === dayOfWeek && s.is_available
    );

    if (daySchedules.length === 0) {
      setAvailableSlots([]);
    } else {
      setAvailableSlots(daySchedules.map((s: any) => s.start_time).sort());
    }
  }, [formData.date, formData.doctorId, doctors]);

  // Reset time if not available in display slots
  useEffect(() => {
    if (formData.time && !displaySlots.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [displaySlots, formData.time]);

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.petName.trim().length >= 1 && formData.petType.length > 0;
      case 1:
        return true; // Doctor is optional
      case 2:
        return formData.date.length > 0 && formData.time.length > 0;
      case 3:
        return true; // Reason is optional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    const validation = appointmentSchema.safeParse({
      date: formData.date,
      time: formData.time,
      petName: formData.petName,
      petType: formData.petType,
      reason: formData.reason || undefined,
    });
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Please check the form');
      return;
    }
    await onSubmit(formData);
  };

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === step;
          const isCompleted = index < step;
          
          return (
            <div key={index} className="flex items-center flex-1">
              <button
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={cn(
                  "flex flex-col items-center gap-1.5 relative group transition-all",
                  index <= step ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <div className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium hidden xs:block text-center",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-1 sm:mx-2",
                  index < step ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[320px]">
        {step === 0 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="petName" className="text-base">
                Pet Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="petName"
                value={formData.petName}
                onChange={(e) => handleInputChange('petName', e.target.value.slice(0, 100))}
                placeholder="Enter your pet's name"
                className="h-12 text-base"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">
                Pet Type <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {PET_TYPES.map((pet) => (
                  <button
                    key={pet.value}
                    type="button"
                    onClick={() => handleInputChange('petType', formData.petType === pet.value ? '' : pet.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm transition-all active:scale-95",
                      formData.petType === pet.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <span className="text-2xl">{pet.icon}</span>
                    <span className="text-xs">{pet.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label className="text-base">Select Doctor</Label>
              <p className="text-sm text-muted-foreground">
                Choose a specific doctor or leave unselected for any available
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleInputChange('doctorId', '')}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-[0.99]",
                !formData.doctorId
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">Any Available Doctor</p>
                <p className="text-sm text-muted-foreground">We'll assign the best available doctor</p>
              </div>
              {!formData.doctorId && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </button>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => handleInputChange('doctorId', formData.doctorId === doctor.id ? '' : doctor.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-[0.99]",
                    formData.doctorId === doctor.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Avatar className="h-12 w-12 border-2 border-background shadow">
                    <AvatarImage src={doctor.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium truncate">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {doctor.specialization || 'General Veterinarian'}
                    </p>
                  </div>
                  {formData.doctorId === doctor.id && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label className="text-base">
                Select Date <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {getNext7Days().map((date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = formData.date === dateStr;
                  const isToday = dateStr === getMinDate();
                  
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleInputChange('date', dateStr)}
                      className={cn(
                        "flex flex-col items-center min-w-[70px] px-3 py-3 rounded-xl border transition-all active:scale-95",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      )}
                    >
                      <span className="text-xs uppercase">
                        {format(date, 'EEE')}
                      </span>
                      <span className="text-xl font-bold">
                        {format(date, 'd')}
                      </span>
                      <span className="text-xs">
                        {isToday ? 'Today' : format(date, 'MMM')}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={getMinDate()}
                className="h-11 mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">
                Select Time <span className="text-destructive">*</span>
              </Label>
              {displaySlots.length === 0 ? (
                <div className="text-center py-6 bg-destructive/5 rounded-xl border border-destructive/20" aria-busy="false">
                  <Clock className="h-8 w-8 text-destructive/60 mx-auto mb-2" />
                  <p className="text-sm text-destructive">
                    {availableSlots.length === 0 ? 'No available slots for this date' : 'All slots are booked'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Try selecting a different date or doctor</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {displaySlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleInputChange('time', formData.time === time ? '' : time)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all active:scale-95",
                        formData.time === time
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-base">Reason for Visit</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value.slice(0, 500))}
                placeholder="Describe why you're bringing your pet (symptoms, checkup, vaccination, etc.)"
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {formData.reason.length}/500 characters
              </p>
            </div>

            {/* Summary Preview */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Appointment Summary</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {PET_TYPES.find(p => p.value === formData.petType)?.icon || '🐾'}
                  </div>
                  <div>
                    <p className="font-semibold">{formData.petName || 'Pet Name'}</p>
                    <p className="text-sm text-muted-foreground">{formData.petType || 'Pet Type'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.date ? format(new Date(formData.date), 'MMM d, yyyy') : 'Select date'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.time || 'Select time'}</span>
                  </div>
                </div>

                {formData.doctorId && (
                  <div className="flex items-center gap-2 text-sm pt-1">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span>{doctors.find(d => d.id === formData.doctorId)?.name || 'Selected doctor'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
        <div className="flex gap-2 flex-1 sm:flex-initial">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              className="flex-1 sm:flex-none"
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
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          )}
        </div>
        
        <div className="flex-1 sm:flex-initial sm:ml-auto">
          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="w-full sm:w-auto"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !canProceed() || displaySlots.length === 0}
              className="w-full sm:w-auto min-w-[160px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentWizard;
