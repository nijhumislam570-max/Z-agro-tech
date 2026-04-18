import { format } from 'date-fns';
import { 
  User, Stethoscope, CheckCircle, XCircle, Clock, 
  Loader2, GraduationCap, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClinicJoinRequests } from '@/hooks/useDoctorJoinRequests';

interface JoinRequestsTabProps {
  clinicId: string;
}

export const JoinRequestsTab = ({ clinicId }: JoinRequestsTabProps) => {
  const { 
    joinRequests, 
    pendingRequests, 
    isLoading, 
    approveRequest, 
    rejectRequest 
  } = useClinicJoinRequests(clinicId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const doctorRequests = joinRequests?.filter(r => r.requested_by === 'doctor') || [];

  return (
    <div className="space-y-6">
      {/* Pending Requests Summary */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-700">
                  {pendingRequests.length} Pending Request{pendingRequests.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-yellow-600/80">
                  Review and approve or reject doctor join requests
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending join requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={request.doctor?.avatar_url || ''} />
                          <AvatarFallback>
                            <Stethoscope className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold">{request.doctor?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {request.doctor?.specialization || 'General Veterinarian'}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            {request.doctor?.experience_years && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {request.doctor.experience_years} yrs exp
                              </span>
                            )}
                            {request.doctor?.qualifications && request.doctor.qualifications.length > 0 && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5" />
                                {request.doctor.qualifications.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>

                          {request.message && (
                            <p className="mt-3 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                              "{request.message}"
                            </p>
                          )}

                          <p className="mt-2 text-xs text-muted-foreground">
                            Requested {format(new Date(request.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveRequest.mutate(request.id)}
                          disabled={approveRequest.isPending}
                        >
                          {approveRequest.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => rejectRequest.mutate(request.id)}
                          disabled={rejectRequest.isPending}
                        >
                          {rejectRequest.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {doctorRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No join requests yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {doctorRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.doctor?.avatar_url || ''} />
                          <AvatarFallback>
                            <Stethoscope className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold">{request.doctor?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {request.doctor?.specialization || 'General Veterinarian'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <Badge className="bg-yellow-500/10 text-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {request.status === 'approved' && (
                          <Badge className="bg-green-500/10 text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {request.status === 'rejected' && (
                          <Badge className="bg-red-500/10 text-red-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
