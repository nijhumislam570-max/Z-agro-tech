import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronLeft, ChevronRight, Loader2, PawPrint, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ClinicDoctor } from '@/hooks/useClinicOwner';

interface AddWalkInAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctors: ClinicDoctor[];
  onSubmit: (data: WalkInAppointmentData) => Promise<void>;
  isSubmitting: boolean;
}

export interface WalkInAppointmentData {
  petName: string;
  petType: string;
  ownerName: string;
  ownerPhone: string;
  doctorId: string | null;
  appointmentDate: Date;
  appointmentTime: string;
  reason: string;
}

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
];

const petTypes = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Reptile', 'Other'];

const AddWalkInAppointmentDialog = ({
  open,
  onOpenChange,
  doctors,
  onSubmit,
  isSubmitting
}: AddWalkInAppointmentDialogProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [formData, setFormData] = useState<WalkInAppointmentData>({
    petName: '',
    petType: '',
    ownerName: '',
    ownerPhone: '',
    doctorId: null,
    appointmentDate: new Date(),
    appointmentTime: '',
    reason: ''
  });

  const resetForm = () => {
    setStep(1);
    setFormData({
      petName: '',
      petType: '',
      ownerName: '',
      ownerPhone: '',
      doctorId: null,
      appointmentDate: new Date(),
      appointmentTime: '',
      reason: ''
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
    resetForm();
  };

  const canProceedStep1 = formData.petName.trim() && formData.petType;
  const canProceedStep2 = true; // Owner info is optional
  const canSubmit = formData.appointmentTime && formData.appointmentDate;

  const formContent = (
    <div className="relative">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating appointment...</p>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                "w-8 sm:w-12 h-1 mx-1 rounded-full transition-colors",
                step > s ? "bg-emerald-500" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Pet Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary mb-4">
            <PawPrint className="h-5 w-5" />
            <h3 className="font-semibold">Pet Information</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="petName">Pet Name *</Label>
            <Input
              id="petName"
              placeholder="Enter pet name"
              value={formData.petName}
              onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="petType">Pet Type *</Label>
            <Select
              value={formData.petType}
              onValueChange={(value) => setFormData({ ...formData, petType: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select pet type" />
              </SelectTrigger>
              <SelectContent>
                {petTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setStep(2)} 
              disabled={!canProceedStep1}
              className="min-h-[44px] gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Owner Info (Optional) */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary mb-4">
            <User className="h-5 w-5" />
            <h3 className="font-semibold">Owner Information (Optional)</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              placeholder="Enter owner name"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerPhone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ownerPhone"
                placeholder="e.g. 01712345678"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                className="h-11 pl-10"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(1)}
              className="min-h-[44px] gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={() => setStep(3)} 
              disabled={!canProceedStep2}
              className="min-h-[44px] gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary mb-4">
            <CalendarIcon className="h-5 w-5" />
            <h3 className="font-semibold">Schedule Appointment</h3>
          </div>

          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="doctor">Assign Doctor (Optional)</Label>
            <Select
              value={formData.doctorId || 'none'}
              onValueChange={(value) => setFormData({ ...formData, doctorId: value === 'none' ? null : value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific doctor</SelectItem>
                {doctors
                  .filter(d => d.status === 'active' && d.doctor)
                  .map((d) => (
                    <SelectItem key={d.doctor!.id} value={d.doctor!.id}>
                      {d.doctor!.name} {d.doctor!.specialization && `- ${d.doctor!.specialization}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Appointment Date *</Label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal",
                    !formData.appointmentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.appointmentDate ? format(formData.appointmentDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                  mode="single"
                  selected={formData.appointmentDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, appointmentDate: date });
                      setDatePopoverOpen(false);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Appointment Time *</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={formData.appointmentTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, appointmentTime: time })}
                  className={cn(
                    "h-9 text-xs",
                    formData.appointmentTime === time && "ring-2 ring-primary ring-offset-1"
                  )}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              placeholder="Brief description of the visit reason..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(2)}
              className="min-h-[44px] gap-2"
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!canSubmit || isSubmitting}
              className="min-h-[44px] gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Appointment
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Always render Dialog on desktop, Drawer on mobile
  // Handle isMobile being undefined on initial render
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Add Walk-in Appointment</DrawerTitle>
            <DrawerDescription>
              Create an appointment for a walk-in patient without an account.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Walk-in Appointment</DialogTitle>
          <DialogDescription>
            Create an appointment for a walk-in patient without an account.
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddWalkInAppointmentDialog;
