import { useState, useMemo } from 'react';
import { Search, Loader2, Send, Stethoscope, CheckCircle, Star, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicJoinRequests } from '@/hooks/useDoctorJoinRequests';

interface InviteDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName?: string;
  existingDoctorIds: string[];
}

export const InviteDoctorDialog = ({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  existingDoctorIds,
}: InviteDoctorDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'search' | 'confirm'>('search');

  const { inviteDoctor, joinRequests } = useClinicJoinRequests(clinicId);

  // Fetch verified independent doctors (not created by any clinic)
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['verified-doctors-for-invite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, avatar_url, specialization, experience_years, qualifications, user_id')
        .eq('is_verified', true)
        .is('created_by_clinic_id', null)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Filter out already affiliated doctors and those with pending requests
  const availableDoctors = useMemo(() => {
    const pendingRequestDoctorIds = joinRequests
      ?.filter(r => r.status === 'pending')
      .map(r => r.doctor_id) || [];

    return doctors.filter(
      d => !existingDoctorIds.includes(d.id) && !pendingRequestDoctorIds.includes(d.id)
    );
  }, [doctors, existingDoctorIds, joinRequests]);

  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return availableDoctors;
    const query = searchQuery.toLowerCase();
    return availableDoctors.filter(
      d => d.name.toLowerCase().includes(query) ||
           d.specialization?.toLowerCase().includes(query)
    );
  }, [availableDoctors, searchQuery]);

  // Check if doctor already has a request
  const getDoctorRequestStatus = (doctorId: string) => {
    return joinRequests?.find(r => r.doctor_id === doctorId);
  };

  const handleSelectDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setStep('confirm');
  };

  const handleSendInvitation = async () => {
    if (!selectedDoctor) return;

    await inviteDoctor.mutateAsync({
      doctorId: selectedDoctor.id,
      message: message || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
    setSelectedDoctor(null);
    setMessage('');
    setStep('search');
  };

  const handleBack = () => {
    setStep('search');
    setSelectedDoctor(null);
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'search' ? 'Invite a Verified Doctor' : 'Confirm Invitation'}
          </DialogTitle>
          <DialogDescription>
            {step === 'search'
              ? 'Search for verified doctors to invite to your clinic.'
              : `Send an invitation to Dr. ${selectedDoctor?.name}`}
          </DialogDescription>
        </DialogHeader>

        {step === 'search' ? (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Doctors List */}
            <ScrollArea className="h-[300px] rounded-md border p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Stethoscope className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No doctors found matching your search' : 'No verified doctors available to invite'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDoctors.map((doctor) => {
                    const existingRequest = getDoctorRequestStatus(doctor.id);
                    
                    return (
                      <button
                        key={doctor.id}
                        onClick={() => !existingRequest && handleSelectDoctor(doctor)}
                        disabled={!!existingRequest}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={doctor.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Stethoscope className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{doctor.name}</p>
                            <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {doctor.specialization || 'General Veterinarian'}
                            {doctor.experience_years && ` • ${doctor.experience_years} yrs exp`}
                          </p>
                        </div>

                        {existingRequest && (
                          <Badge 
                            variant="outline" 
                            className={
                              existingRequest.status === 'pending' 
                                ? 'text-warning' 
                                : existingRequest.status === 'approved'
                                ? 'text-success'
                                : 'text-destructive'
                            }
                          >
                            {existingRequest.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {existingRequest.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {existingRequest.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                            {existingRequest.status}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Doctor Preview */}
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                <AvatarImage src={selectedDoctor?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Stethoscope className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedDoctor?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDoctor?.specialization || 'General Veterinarian'}
                </p>
                {selectedDoctor?.qualifications?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedDoctor.qualifications.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <Label htmlFor="invite-message">Message (optional)</Label>
              <Textarea
                id="invite-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Invite Dr. ${selectedDoctor?.name} to join ${clinicName || 'your clinic'}...`}
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'confirm' && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'confirm' && (
            <Button
              onClick={handleSendInvitation}
              disabled={inviteDoctor.isPending || !selectedDoctor}
            >
              {inviteDoctor.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};