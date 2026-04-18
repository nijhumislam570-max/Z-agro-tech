import { useState } from 'react';
import { 
  Building2, MapPin, Star, Search, 
  Send, Loader2, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useVerifiedClinics, useDoctorJoinRequests } from '@/hooks/useDoctorJoinRequests';

interface ClinicBrowserProps {
  doctorId: string;
}

export const ClinicBrowser = ({ doctorId }: ClinicBrowserProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [message, setMessage] = useState('');

  const { data: clinics, isLoading: clinicsLoading } = useVerifiedClinics();
  const { joinRequests, requestJoinClinic, cancelRequest } = useDoctorJoinRequests(doctorId);

  const filteredClinics = clinics?.filter(clinic =>
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.address?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getRequestStatus = (clinicId: string) => {
    return joinRequests?.find(r => r.clinic_id === clinicId);
  };

  const handleRequestJoin = async () => {
    if (!selectedClinic) return;

    await requestJoinClinic.mutateAsync({
      clinicId: selectedClinic.id,
      message: message || undefined,
    });

    setIsRequestOpen(false);
    setSelectedClinic(null);
    setMessage('');
  };

  const openRequestDialog = (clinic: any) => {
    setSelectedClinic(clinic);
    setIsRequestOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clinics by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clinics List */}
      {clinicsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No verified clinics found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredClinics.map((clinic) => {
            const request = getRequestStatus(clinic.id);
            
            return (
              <Card key={clinic.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="h-14 w-14 rounded-lg">
                      <AvatarImage src={clinic.image_url || ''} />
                      <AvatarFallback className="rounded-lg bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold truncate">{clinic.name}</h3>
                          {clinic.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{clinic.address}</span>
                            </p>
                          )}
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 flex-shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        {clinic.rating && clinic.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            {clinic.rating}
                          </span>
                        )}
                        {clinic.services && clinic.services.length > 0 && (
                          <span>{clinic.services.length} services</span>
                        )}
                      </div>

                      <div className="mt-3">
                        {request ? (
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Badge className="bg-yellow-500/10 text-yellow-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => cancelRequest.mutate(request.id)}
                                  disabled={cancelRequest.isPending}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <Badge className="bg-green-500/10 text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Affiliated
                              </Badge>
                            )}
                            {request.status === 'rejected' && (
                              <Badge className="bg-red-500/10 text-red-600">
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => openRequestDialog(clinic)}
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Request to Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Dialog */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join {selectedClinic?.name}</DialogTitle>
            <DialogDescription>
              Send a request to join this clinic. The clinic owner will review your request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedClinic?.image_url || ''} />
                <AvatarFallback>
                  <Building2 className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedClinic?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedClinic?.address}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself or explain why you'd like to join..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestJoin}
              disabled={requestJoinClinic.isPending}
            >
              {requestJoinClinic.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
