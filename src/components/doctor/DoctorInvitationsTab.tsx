import { format } from 'date-fns';
import { Building2, CheckCircle, XCircle, Loader2, MapPin, Star, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoctorJoinRequests, DoctorJoinRequest } from '@/hooks/useDoctorJoinRequests';

interface DoctorInvitationsTabProps {
  doctorId: string;
}

export const DoctorInvitationsTab = ({ doctorId }: DoctorInvitationsTabProps) => {
  const { 
    joinRequests, 
    pendingInvitations, 
    isLoading, 
    acceptInvitation, 
    rejectInvitation 
  } = useDoctorJoinRequests(doctorId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get all clinic invitations (requested_by = 'clinic')
  const allClinicInvitations = joinRequests?.filter(r => r.requested_by === 'clinic') || [];

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Clinic Invitations
              </CardTitle>
              <CardDescription>
                Clinics that want you to join their team
              </CardDescription>
            </div>
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="bg-warning/10 text-warning">
                {pendingInvitations.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No pending invitations</p>
              <p className="text-sm text-muted-foreground mt-1">
                When clinics invite you, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={() => acceptInvitation.mutate(invitation.id)}
                  onReject={() => rejectInvitation.mutate(invitation.id)}
                  isAccepting={acceptInvitation.isPending}
                  isRejecting={rejectInvitation.isPending}
                  showActions
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Invitations */}
      {allClinicInvitations.filter(r => r.status !== 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Past Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allClinicInvitations
                .filter(r => r.status !== 'pending')
                .map((invitation) => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    showActions={false}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface InvitationCardProps {
  invitation: DoctorJoinRequest;
  onAccept?: () => void;
  onReject?: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  showActions?: boolean;
}

const InvitationCard = ({
  invitation,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  showActions,
}: InvitationCardProps) => {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
      <Avatar className="h-14 w-14 rounded-lg">
        <AvatarImage src={invitation.clinic?.image_url || ''} />
        <AvatarFallback className="rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold">{invitation.clinic?.name}</h4>
            {invitation.clinic?.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {invitation.clinic.address}
              </p>
            )}
          </div>
          
          {invitation.status !== 'pending' && (
            <Badge 
              variant="outline"
              className={
                invitation.status === 'approved' 
                  ? 'text-success bg-success/10' 
                  : 'text-destructive bg-destructive/10'
              }
            >
              {invitation.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
              {invitation.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
              {invitation.status === 'approved' ? 'Accepted' : 'Declined'}
            </Badge>
          )}
        </div>

        {invitation.message && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            "{invitation.message}"
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {invitation.clinic?.is_verified && (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle className="h-3 w-3" />
              Verified Clinic
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(invitation.created_at), 'MMM d, yyyy')}
          </span>
        </div>

        {showActions && invitation.status === 'pending' && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={onAccept}
              disabled={isAccepting || isRejecting}
              className="gap-1.5"
            >
              {isAccepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isAccepting || isRejecting}
              className="gap-1.5"
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorInvitationsTab;