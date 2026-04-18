import { useState } from 'react';
import { Calendar, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BookAppointmentWizard from '@/components/booking/BookAppointmentWizard';

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName: string;
  doctors: any[];
  doctorsLoading?: boolean;
  onSuccess?: () => void;
  onNeedAuth?: () => void;
}

const BookAppointmentDialog = ({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  doctors,
  doctorsLoading = false,
  onSuccess,
  onNeedAuth,
}: BookAppointmentDialogProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isBooking, setIsBooking] = useState(false);

  const handleBookingSubmit = async (formData: any) => {
    if (!user) {
      toast.error('Please sign in to book an appointment');
      onOpenChange(false);
      onNeedAuth?.();
      return;
    }
    
    setIsBooking(true);
    try {
      const insertData: any = {
        user_id: user.id, 
        clinic_id: clinicId,
        appointment_date: formData.date, 
        appointment_time: formData.time,
        pet_name: formData.petName, 
        pet_type: formData.petType, 
        reason: formData.reason || ''
      };

      if (formData.doctorId) {
        insertData.doctor_id = formData.doctorId;
      }

      const { error } = await supabase.from('appointments').insert([insertData]);
      if (error) throw error;
      
      toast.success('Appointment Booked! You will receive a confirmation soon.');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const content = (
    <div className="px-1 relative">
      {/* Loading overlay to prevent double-submission */}
      {isBooking && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Booking appointment...</p>
          </div>
        </div>
      )}
      {doctorsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <BookAppointmentWizard
          onSubmit={handleBookingSubmit}
          isPending={isBooking}
          doctors={doctors}
          clinicName={clinicName}
          clinicId={clinicId}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </div>
  );

  // Use Drawer for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DrawerTitle className="text-left text-lg">Book Appointment</DrawerTitle>
                  <p className="text-sm text-muted-foreground text-left">{clinicName}</p>
                </div>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 pt-4" style={{ maxHeight: 'calc(95vh - 100px)' }}>
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Book Appointment</DialogTitle>
              <p className="text-sm text-muted-foreground">{clinicName}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6 pt-4 flex-1">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookAppointmentDialog;
