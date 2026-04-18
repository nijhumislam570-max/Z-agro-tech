import { format } from 'date-fns';
import { Calendar, Clock, User, Stethoscope, Phone, FileText, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  pet_name: string | null;
  pet_type: string | null;
  reason: string | null;
  status: string | null;
  created_at: string;
  doctor?: {
    id: string;
    name: string;
    specialization: string | null;
    avatar_url: string | null;
  } | null;
}

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isUpdating: boolean;
  clinicPhone?: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'confirmed':
      return { color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle, label: 'Confirmed' };
    case 'pending':
      return { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: AlertCircle, label: 'Pending' };
    case 'cancelled':
      return { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle, label: 'Cancelled' };
    case 'completed':
      return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle, label: 'Completed' };
    default:
      return { color: 'bg-muted text-muted-foreground', icon: AlertCircle, label: status };
  }
};

const AppointmentDetailsDialog = ({
  appointment,
  open,
  onOpenChange,
  onUpdateStatus,
  isUpdating,
  clinicPhone
}: AppointmentDetailsDialogProps) => {
  const [notes, setNotes] = useState('');

  if (!appointment) return null;

  const statusInfo = getStatusInfo(appointment.status || 'pending');
  const StatusIcon = statusInfo.icon;

  const isPast = new Date(appointment.appointment_date) < new Date(new Date().toDateString());
  const isToday = format(new Date(), 'yyyy-MM-dd') === appointment.appointment_date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            View and manage this appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Banner */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${statusInfo.color}`}>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <span className="font-medium">{statusInfo.label}</span>
            </div>
            {isToday && appointment.status === 'confirmed' && (
              <Badge variant="default" className="bg-primary">Today</Badge>
            )}
          </div>

          {/* Pet & Patient Info */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{appointment.pet_name || 'Unknown Pet'}</h3>
                <p className="text-sm text-muted-foreground">{appointment.pet_type || 'Pet'}</p>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Date
              </div>
              <p className="font-semibold">
                {format(new Date(appointment.appointment_date), 'EEEE, MMM d, yyyy')}
              </p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                Time
              </div>
              <p className="font-semibold">{appointment.appointment_time}</p>
            </div>
          </div>

          {/* Doctor Info */}
          {appointment.doctor && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={appointment.doctor.avatar_url || ''} />
                <AvatarFallback>
                  <Stethoscope className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Dr. {appointment.doctor.name}</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.doctor.specialization || 'General Veterinarian'}
                </p>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label className="text-muted-foreground flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              Reason for Visit
            </Label>
            <p className="text-sm bg-secondary/30 rounded-lg p-3">
              {appointment.reason || 'No reason provided'}
            </p>
          </div>

          {/* Clinic Notes (for internal use) */}
          {appointment.status === 'confirmed' && (
            <div>
              <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                <Edit className="h-4 w-4" />
                Internal Notes
              </Label>
              <Textarea
                placeholder="Add notes about this appointment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}

          <Separator />

          {/* Booking Info */}
          <div className="text-xs text-muted-foreground">
            Booked on {format(new Date(appointment.created_at), 'MMM d, yyyy \'at\' h:mm a')}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {appointment.status === 'pending' && (
            <>
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                disabled={isUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            </>
          )}
          {appointment.status === 'confirmed' && !isPast && (
            <>
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={() => onUpdateStatus(appointment.id, 'completed')}
                disabled={isUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            </>
          )}
          {(appointment.status === 'completed' || appointment.status === 'cancelled' || (appointment.status === 'confirmed' && isPast)) && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsDialog;
