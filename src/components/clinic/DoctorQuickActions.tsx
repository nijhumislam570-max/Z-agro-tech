import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, Mail, Phone, Edit, Trash2, Calendar, 
  DollarSign, GraduationCap, Clock, CheckCircle, XCircle,
  Eye, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Doctor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  avatar_url: string | null;
  is_available: boolean;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  license_number: string | null;
  bio: string | null;
}

interface ClinicDoctor {
  id: string;
  clinic_id: string;
  doctor_id: string;
  status: string;
  joined_at: string;
  doctor?: Doctor;
}

interface DoctorQuickActionsProps {
  doctors: ClinicDoctor[];
  onStatusChange: (id: string, status: string) => void;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctorId: string) => void;
  isUpdating: boolean;
}

const DoctorQuickActions = ({
  doctors,
  onStatusChange,
  onEdit,
  onDelete,
  isUpdating
}: DoctorQuickActionsProps) => {
  const [selectedDoctor, setSelectedDoctor] = useState<ClinicDoctor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((cd) => (
          <Card 
            key={cd.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
              cd.status !== 'active' ? 'opacity-60' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/20 shrink-0">
                  <AvatarImage src={cd.doctor?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10">
                    <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        Dr. {cd.doctor?.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {cd.doctor?.specialization || 'General Veterinarian'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedDoctor(cd)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => cd.doctor && onEdit(cd.doctor)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/clinic/profile?tab=schedules">
                            <Calendar className="h-4 w-4 mr-2" />
                            Manage Schedule
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => cd.doctor && setDeleteConfirm(cd.doctor.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge 
                      variant={cd.doctor?.is_available ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {cd.doctor?.is_available ? '🟢 Available' : '🔴 Unavailable'}
                    </Badge>
                    {cd.doctor?.consultation_fee && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <DollarSign className="h-3 w-3" />
                        ৳{cd.doctor.consultation_fee}
                      </Badge>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {cd.doctor?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{cd.doctor.phone}</span>
                      </span>
                    )}
                    {cd.doctor?.experience_years && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {cd.doctor.experience_years} yrs
                      </span>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Clinic Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${cd.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {cd.status}
                      </span>
                      <Switch
                        checked={cd.status === 'active'}
                        onCheckedChange={(checked) => 
                          onStatusChange(cd.id, checked ? 'active' : 'inactive')
                        }
                        disabled={isUpdating}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doctor Details Dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={(open) => !open && setSelectedDoctor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Doctor Details
            </DialogTitle>
            <DialogDescription>
              Full profile information
            </DialogDescription>
          </DialogHeader>

          {selectedDoctor?.doctor && (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={selectedDoctor.doctor.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">Dr. {selectedDoctor.doctor.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedDoctor.doctor.specialization || 'General Veterinarian'}
                  </p>
                  <Badge variant={selectedDoctor.doctor.is_available ? 'default' : 'secondary'} className="mt-1">
                    {selectedDoctor.doctor.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                {selectedDoctor.doctor.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedDoctor.doctor.email}</span>
                  </div>
                )}
                {selectedDoctor.doctor.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedDoctor.doctor.phone}</span>
                  </div>
                )}
              </div>

              {/* Professional Info */}
              <div className="grid grid-cols-2 gap-3">
                {selectedDoctor.doctor.experience_years && (
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-primary">{selectedDoctor.doctor.experience_years}</p>
                    <p className="text-xs text-muted-foreground">Years Experience</p>
                  </div>
                )}
                {selectedDoctor.doctor.consultation_fee && (
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-primary">৳{selectedDoctor.doctor.consultation_fee}</p>
                    <p className="text-xs text-muted-foreground">Consultation Fee</p>
                  </div>
                )}
              </div>

              {/* Qualifications */}
              {selectedDoctor.doctor.qualifications && selectedDoctor.doctor.qualifications.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Qualifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoctor.doctor.qualifications.map((q, i) => (
                      <Badge key={i} variant="outline">{q}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedDoctor.doctor.bio && (
                <div>
                  <p className="text-sm font-medium mb-2">About</p>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.doctor.bio}</p>
                </div>
              )}

              {/* License */}
              {selectedDoctor.doctor.license_number && (
                <div className="text-xs text-muted-foreground">
                  License: {selectedDoctor.doctor.license_number}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the doctor from your clinic. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DoctorQuickActions;
