import { useState } from 'react';
import { format, isToday, isPast, isFuture, parseISO } from 'date-fns';
import { 
  Calendar, Clock, Users, CheckCircle, XCircle, 
  AlertCircle, Eye, Filter, Search, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  pet_name: string | null;
  pet_type: string | null;
  reason: string | null;
  status: string | null;
  doctor?: {
    id: string;
    name: string;
    avatar_url?: string;
    specialization?: string;
  } | null;
}

interface ClinicAppointmentsListProps {
  appointments: Appointment[];
  onStatusChange: (id: string, status: string) => void;
  isUpdating?: boolean;
}

const ClinicAppointmentsList = ({ 
  appointments, 
  onStatusChange,
  isUpdating 
}: ClinicAppointmentsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { 
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', 
          icon: CheckCircle,
          label: 'Confirmed'
        };
      case 'pending':
        return { 
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', 
          icon: Clock,
          label: 'Pending'
        };
      case 'cancelled':
        return { 
          color: 'bg-red-500/10 text-red-600 border-red-500/20', 
          icon: XCircle,
          label: 'Cancelled'
        };
      case 'completed':
        return { 
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', 
          icon: CheckCircle,
          label: 'Completed'
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground', 
          icon: AlertCircle,
          label: status 
        };
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isPast(date)) return format(date, 'MMM d, yyyy');
    return format(date, 'MMM d, yyyy');
  };

  const filteredAppointments = appointments
    .filter(apt => {
      const matchesSearch = 
        apt.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by date, then by time
      const dateCompare = new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.appointment_time.localeCompare(b.appointment_time);
    });

  // Group by date
  const groupedAppointments = filteredAppointments.reduce((acc, apt) => {
    const date = apt.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div className="space-y-4">
      {/* Compact Header with Filters */}
      <div className="space-y-3">
        {/* Search and Status Dropdown in one row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pet, reason, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-background border-border/50"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 h-10 px-3 min-w-[130px] border-border/50 bg-background"
              >
                <Filter className="h-4 w-4" />
                <span className="capitalize">{filterStatus === 'all' ? 'All Status' : filterStatus}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(statusCounts).map(([status, count]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn("justify-between", filterStatus === status && "bg-muted")}
                >
                  <span className="capitalize">{status}</span>
                  <Badge variant="secondary" className="ml-2 font-normal">{count}</Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Horizontal Scrollable Status Pills */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap min-h-[36px] active:scale-95 flex-shrink-0",
                  filterStatus === status
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 hover:bg-muted text-muted-foreground"
                )}
              >
                <span className="capitalize">{status}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  filterStatus === status 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-background text-foreground/70"
                )}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {Object.keys(groupedAppointments).length > 0 ? (
        <div className="space-y-5">
          {Object.entries(groupedAppointments).map(([date, apts]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium",
                  isToday(parseISO(date)) 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {getDateLabel(date)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {apts.length} appointment{apts.length !== 1 && 's'}
                </span>
              </div>
              
              {/* Appointment Cards */}
              <div className="space-y-2.5">
                {apts.map((apt) => {
                  const statusInfo = getStatusInfo(apt.status || 'pending');
                  const StatusIcon = statusInfo.icon;
                  const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
                  const isPastAppointment = isPast(appointmentDateTime);
                  const isWalkIn = apt.reason?.startsWith('[Walk-in]');
                  
                  return (
                    <Card 
                      key={apt.id}
                      className={cn(
                        "transition-all hover:shadow-md border-border/50 bg-card",
                        isPastAppointment && apt.status === 'pending' && "border-amber-500/50 bg-amber-50/30"
                      )}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          {/* Time Badge */}
                          <div className="flex flex-col items-center justify-center bg-muted/70 rounded-xl p-2.5 min-w-[65px] border border-border/30">
                            <span className="text-base sm:text-lg font-bold text-foreground leading-tight">
                              {apt.appointment_time.split(' ')[0]}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {apt.appointment_time.split(' ')[1]}
                            </span>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Pet Name & Type */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-foreground text-sm sm:text-base">
                                {apt.pet_name || 'Unknown Pet'}
                              </span>
                              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                                {apt.pet_type || 'Pet'}
                              </Badge>
                              {isWalkIn && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary">
                                  Walk-in
                                </Badge>
                              )}
                            </div>
                            
                            {/* Reason */}
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2">
                              {isWalkIn 
                                ? apt.reason?.replace('[Walk-in]', '').split('|').pop()?.trim() || 'General Checkup'
                                : apt.reason || 'General Checkup'
                              }
                            </p>
                            
                            {/* Status Badge + Actions Row */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <Badge className={cn(statusInfo.color, "text-[10px] sm:text-xs gap-1")}>
                                <StatusIcon className="h-3 w-3" />
                                {statusInfo.label}
                              </Badge>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 active:scale-95 transition-transform"
                                  onClick={() => setSelectedAppointment(apt)}
                                  aria-label="View appointment details"
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                
                                {apt.status === 'pending' && (
                                  <>
                                    <Button 
                                      size="icon"
                                      variant="ghost"
                                      className="h-9 w-9 min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-transform"
                                      onClick={() => onStatusChange(apt.id, 'confirmed')}
                                      disabled={isUpdating}
                                      aria-label="Confirm appointment"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="icon"
                                      variant="ghost"
                                      className="h-9 w-9 min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-transform"
                                      onClick={() => onStatusChange(apt.id, 'cancelled')}
                                      disabled={isUpdating}
                                      aria-label="Cancel appointment"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                
                                {apt.status === 'confirmed' && (
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    className="h-9 min-h-[44px] sm:h-8 sm:min-h-0 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 active:scale-95 transition-transform px-2.5"
                                    onClick={() => onStatusChange(apt.id, 'completed')}
                                    disabled={isUpdating}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {/* Doctor Info (if assigned) */}
                            {apt.doctor && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={apt.doctor.avatar_url} />
                                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                    {apt.doctor.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  Dr. {apt.doctor.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1 text-foreground">No appointments found</h3>
          <p className="text-muted-foreground text-sm">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Appointments will appear here when booked'}
          </p>
        </div>
      )}

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedAppointment.appointment_date), 'EEEE, MMMM d, yyyy')} at {selectedAppointment.appointment_time}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl bg-primary/10">
                      {selectedAppointment.pet_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedAppointment.pet_name}</h3>
                    <p className="text-muted-foreground">{selectedAppointment.pet_type}</p>
                    <Badge className={getStatusInfo(selectedAppointment.status || 'pending').color}>
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(parseISO(selectedAppointment.appointment_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedAppointment.appointment_time}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason for Visit</p>
                  <p>{selectedAppointment.reason || 'General Checkup'}</p>
                </div>

                {selectedAppointment.doctor && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={selectedAppointment.doctor.avatar_url} />
                      <AvatarFallback>
                        {selectedAppointment.doctor.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Dr. {selectedAppointment.doctor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.doctor.specialization || 'General Veterinarian'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {selectedAppointment.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        onStatusChange(selectedAppointment.id, 'confirmed');
                        setSelectedAppointment(null);
                      }}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        onStatusChange(selectedAppointment.id, 'cancelled');
                        setSelectedAppointment(null);
                      }}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicAppointmentsList;
