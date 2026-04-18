import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar, Building2, Loader2, ChevronDown, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DoctorScheduleManagerProps {
  doctorId: string;
  clinicAffiliations: any[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
];

export const DoctorScheduleManager = ({ doctorId, clinicAffiliations }: DoctorScheduleManagerProps) => {
  const queryClient = useQueryClient();
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [expandedDays, setExpandedDays] = useState<number[]>([]);

  // Find clinic_doctors entry for selected clinic
  const selectedAffiliation = clinicAffiliations?.find(
    aff => aff.clinic?.id === selectedClinicId
  );

  // Fetch schedules for this doctor at selected clinic
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['doctor-schedules', doctorId, selectedClinicId],
    queryFn: async () => {
      if (!selectedClinicId) return [];

      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('clinic_id', selectedClinicId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedClinicId && !!doctorId,
  });

  // Add schedule slot
  const addSlotMutation = useMutation({
    mutationFn: async ({ dayOfWeek, startTime }: { dayOfWeek: number; startTime: string }) => {
      // Calculate end time (30 min default)
      const [hours, minutes] = startTime.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes + 30, 0, 0);
      const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('doctor_schedules')
        .insert({
          doctor_id: doctorId,
          clinic_id: selectedClinicId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_available: true,
          slot_duration_minutes: 30,
          max_appointments: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules', doctorId, selectedClinicId] });
      toast.success('Time slot added');
    },
    onError: () => {
      toast.error('Failed to add time slot');
    },
  });

  // Delete schedule slot
  const deleteSlotMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules', doctorId, selectedClinicId] });
      toast.success('Time slot removed');
    },
    onError: () => {
      toast.error('Failed to remove time slot');
    },
  });

  // Toggle availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ scheduleId, isAvailable }: { scheduleId: string; isAvailable: boolean }) => {
      const { error } = await supabase
        .from('doctor_schedules')
        .update({ is_available: isAvailable })
        .eq('id', scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules', doctorId, selectedClinicId] });
    },
    onError: () => {
      toast.error('Failed to update availability');
    },
  });

  const toggleDay = (day: number) => {
    setExpandedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getSchedulesForDay = (dayOfWeek: number) => {
    return schedules.filter(s => s.day_of_week === dayOfWeek);
  };

  // Get existing time slots for a day to prevent duplicates
  const getExistingTimesForDay = (dayOfWeek: number) => {
    return getSchedulesForDay(dayOfWeek).map(s => s.start_time);
  };

  if (!clinicAffiliations || clinicAffiliations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No clinic affiliations</p>
          <p className="text-sm text-muted-foreground">
            Join a clinic first to manage your schedule there.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clinic Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Management
          </CardTitle>
          <CardDescription>
            Set your availability for each clinic you work at
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Clinic</Label>
              <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a clinic to manage schedule" />
                </SelectTrigger>
                <SelectContent>
                  {clinicAffiliations
                    .filter(aff => aff.status === 'active')
                    .map(aff => (
                      <SelectItem key={aff.clinic?.id} value={aff.clinic?.id || ''}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {aff.clinic?.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClinicId && selectedAffiliation && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedAffiliation.clinic?.image_url || ''} />
                  <AvatarFallback>
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedAffiliation.clinic?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAffiliation.clinic?.address || 'No address'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Editor */}
      {selectedClinicId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Schedule</CardTitle>
            <CardDescription>
              Configure your available time slots for each day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {DAYS_OF_WEEK.map(day => {
                  const daySchedules = getSchedulesForDay(day.value);
                  const isExpanded = expandedDays.includes(day.value);
                  const existingTimes = getExistingTimesForDay(day.value);
                  const availableTimes = TIME_SLOTS.filter(t => !existingTimes.includes(t));

                  return (
                    <Collapsible
                      key={day.value}
                      open={isExpanded}
                      onOpenChange={() => toggleDay(day.value)}
                    >
                      <Card className="border shadow-none">
                        <CollapsibleTrigger asChild>
                          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{day.label}</span>
                              {daySchedules.length > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  {daySchedules.filter(s => s.is_available).length} slots
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  No slots
                                </Badge>
                              )}
                            </div>
                            <ChevronDown className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-3">
                            {/* Existing Slots */}
                            {daySchedules.length > 0 && (
                              <div className="space-y-2">
                                {daySchedules.map(schedule => (
                                  <div
                                    key={schedule.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {schedule.start_time} - {schedule.end_time}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={schedule.is_available}
                                          onCheckedChange={(checked) =>
                                            toggleAvailabilityMutation.mutate({
                                              scheduleId: schedule.id,
                                              isAvailable: checked,
                                            })
                                          }
                                        />
                                        <span className="text-sm text-muted-foreground">
                                          {schedule.is_available ? 'Available' : 'Unavailable'}
                                        </span>
                                      </div>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteSlotMutation.mutate(schedule.id)}
                                        disabled={deleteSlotMutation.isPending}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add New Slot */}
                            {availableTimes.length > 0 && (
                              <div className="flex items-center gap-2 pt-2">
                                <Select
                                  onValueChange={(time) => {
                                    addSlotMutation.mutate({ dayOfWeek: day.value, startTime: time });
                                  }}
                                  disabled={addSlotMutation.isPending}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Add time slot..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableTimes.map(time => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {addSlotMutation.isPending && (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                              </div>
                            )}

                            {daySchedules.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No slots configured for {day.label}
                              </p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorScheduleManager;