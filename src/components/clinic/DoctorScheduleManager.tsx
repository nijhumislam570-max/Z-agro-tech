import { useState } from 'react';
import { Plus, Trash2, Copy, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DoctorScheduleManagerProps {
  clinicId: string;
  doctors: Array<{ id: string; name: string }>;
}

interface Schedule {
  id: string;
  doctor_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_available: boolean;
  max_appointments: number;
}

const DAYS_OF_WEEK = [
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
];

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM'
];

const DoctorScheduleManager = ({ clinicId, doctors }: DoctorScheduleManagerProps) => {
  
  const queryClient = useQueryClient();
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [expandedDays, setExpandedDays] = useState<number[]>([6, 0, 1, 2, 3, 4, 5]); // All expanded by default

  const queryKey = ['doctor-schedules', clinicId, selectedDoctor];

  const { data: schedules = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!selectedDoctor) return [];
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('doctor_id', selectedDoctor)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!selectedDoctor,
  });

  const addSlotMutation = useMutation({
    mutationFn: async (slot: Omit<Schedule, 'id'>) => {
      const { error } = await supabase.from('doctor_schedules').insert([slot]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Time slot added successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to add slot';
      if (message.includes('duplicate') || message.includes('unique')) {
        toast.error('This time slot is already configured.');
      } else {
        toast.error(message);
      }
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from('doctor_schedules').delete().eq('id', slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Time slot removed');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to remove slot';
      toast.error(message);
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ slotId, isAvailable }: { slotId: string; isAvailable: boolean }) => {
      const { error } = await supabase
        .from('doctor_schedules')
        .update({ is_available: isAvailable })
        .eq('id', slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to toggle availability';
      toast.error(message);
    },
  });

  const copyScheduleMutation = useMutation({
    mutationFn: async (targetDoctorId: string) => {
      if (!selectedDoctor || selectedDoctor === targetDoctorId) return;
      
      // Delete existing schedules for target doctor
      await supabase
        .from('doctor_schedules')
        .delete()
        .eq('clinic_id', clinicId)
        .eq('doctor_id', targetDoctorId);

      // Copy schedules
      const newSchedules = schedules.map(s => ({
        doctor_id: targetDoctorId,
        clinic_id: clinicId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration_minutes: s.slot_duration_minutes,
        is_available: s.is_available,
        max_appointments: s.max_appointments,
      }));

      if (newSchedules.length > 0) {
        const { error } = await supabase.from('doctor_schedules').insert(newSchedules);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules', clinicId] });
      toast.success('Schedule copied successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to copy schedule';
      toast.error(message);
    },
  });

  const handleAddSlot = (dayOfWeek: number, startTime: string) => {
    if (!selectedDoctor) return;

    // Calculate end time (30 min later)
    const timeIndex = TIME_SLOTS.indexOf(startTime);
    const endTime = TIME_SLOTS[timeIndex + 1] || startTime;

    addSlotMutation.mutate({
      doctor_id: selectedDoctor,
      clinic_id: clinicId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: 30,
      is_available: true,
      max_appointments: 1,
    });
  };

  const getScheduleForSlot = (dayOfWeek: number, startTime: string) => {
    return schedules.find(s => s.day_of_week === dayOfWeek && s.start_time === startTime);
  };

  const toggleDay = (dayValue: number) => {
    setExpandedDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const groupedSchedules = DAYS_OF_WEEK.map(day => ({
    ...day,
    slots: schedules.filter(s => s.day_of_week === day.value),
  }));

  const totalActiveSlots = schedules.filter(s => s.is_available).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Doctor Selection & Actions */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
          <div className="flex-1 sm:max-w-xs">
            <Label className="mb-2 block text-sm">Select Doctor</Label>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDoctor && doctors.length > 1 && (
            <Select onValueChange={(value) => copyScheduleMutation.mutate(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <Copy className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Copy schedule to..." />
              </SelectTrigger>
              <SelectContent>
                {doctors
                  .filter(d => d.id !== selectedDoctor)
                  .map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quick Overview */}
        {selectedDoctor && !isLoading && (
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {totalActiveSlots} active slots
            </Badge>
            <Badge variant="outline" className="gap-1">
              {schedules.length} total configured
            </Badge>
          </div>
        )}
      </div>

      {!selectedDoctor ? (
        <Card>
          <CardContent className="py-10 sm:py-12 text-center text-muted-foreground">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm sm:text-base">Select a doctor to manage their schedule</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-10 sm:py-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {groupedSchedules.map(day => (
            <Collapsible 
              key={day.value} 
              open={expandedDays.includes(day.value)}
              onOpenChange={() => toggleDay(day.value)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="text-sm sm:text-base font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline">{day.label}</span>
                        <span className="sm:hidden">{day.short}</span>
                        {day.slots.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {day.slots.filter(s => s.is_available).length}/{day.slots.length}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {expandedDays.includes(day.value) ? '▼' : '▶'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="py-3 pt-0">
                    {day.slots.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <span>No slots configured</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {day.slots.map(slot => (
                          <div
                            key={slot.id}
                            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border ${
                              slot.is_available
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-muted border-border text-muted-foreground line-through'
                            }`}
                          >
                            <span className="whitespace-nowrap">{slot.start_time}</span>
                            <Switch
                              checked={slot.is_available}
                              onCheckedChange={(checked) =>
                                toggleAvailabilityMutation.mutate({ slotId: slot.id, isAvailable: checked })
                              }
                              className="h-4 w-7 data-[state=checked]:bg-primary"
                            />
                            <button
                              onClick={() => deleteSlotMutation.mutate(slot.id)}
                              className="text-destructive hover:text-destructive/80 p-0.5"
                              aria-label="Delete slot"
                            >
                              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Select onValueChange={(time) => handleAddSlot(day.value, time)}>
                      <SelectTrigger className="w-full sm:w-40 h-9">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="text-xs sm:text-sm">Add Slot</span>
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.filter(time => !getScheduleForSlot(day.value, time)).map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorScheduleManager;