import { useState } from 'react';
import { Edit, Trash2, ToggleLeft, ToggleRight, Package, Clock, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
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

interface ClinicService {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
}

interface ServiceQuickActionsProps {
  services: ClinicService[];
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (service: ClinicService) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

const ServiceQuickActions = ({
  services,
  onToggleActive,
  onEdit,
  onDelete,
  isUpdating
}: ServiceQuickActionsProps) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {services.map((service) => (
          <Card 
            key={service.id}
            className={`overflow-hidden transition-all duration-200 ${
              service.is_active 
                ? 'hover:shadow-lg' 
                : 'opacity-60 hover:opacity-80'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 ${
                    service.is_active 
                      ? 'bg-primary/10' 
                      : 'bg-muted'
                  }`}>
                    <Package className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      service.is_active ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-sm sm:text-base truncate ${
                        !service.is_active && 'line-through text-muted-foreground'
                      }`}>
                        {service.name}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2">
                      {service.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {service.price && (
                        <span className="flex items-center gap-1 text-sm font-medium text-primary">
                          <DollarSign className="h-3 w-3" />
                          ৳{service.price}
                        </span>
                      )}
                      {service.duration_minutes && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} mins
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={(checked) => onToggleActive(service.id, checked)}
                      disabled={isUpdating}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirm(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this service. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ServiceQuickActions;
