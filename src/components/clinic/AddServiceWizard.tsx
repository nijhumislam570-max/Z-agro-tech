import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Package, DollarSign, Clock, FileText, Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { serviceFormSchema, type ServiceFormData } from '@/lib/validations';
import { toast } from 'sonner';

const DURATION_PRESETS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

interface AddServiceWizardProps {
  onSubmit: (data: {
    name: string;
    description: string | null;
    price: number | null;
    duration_minutes: number | null;
    is_active: boolean;
  }) => Promise<void>;
  isPending: boolean;
  onCancel?: () => void;
  initialData?: {
    name: string;
    description: string;
    price: string;
    duration_minutes: string;
    is_active: boolean;
    
  };
  isEditing?: boolean;
}

const AddServiceWizard = ({ onSubmit, isPending, onCancel, initialData, isEditing = false }: AddServiceWizardProps) => {
  const [step, setStep] = useState(0);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || '',
      duration_minutes: initialData?.duration_minutes || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  const steps = [
    { title: 'Service Info', description: 'Name and category', icon: Package, fields: ['name'] as const },
    { title: 'Details', description: 'Description and settings', icon: FileText, fields: ['description'] as const },
    { title: 'Pricing', description: 'Cost and duration', icon: DollarSign, fields: ['price', 'duration_minutes'] as const },
  ];

  const canProceed = () => {
    switch (step) {
      case 0: return (form.watch('name') || '').trim().length >= 2;
      case 1: return true;
      case 2: return true;
      default: return false;
    }
  };

  const handleFormSubmit = async (values: ServiceFormData) => {
    try {
      await onSubmit({
        name: values.name,
        description: values.description || null,
        price: values.price ? parseFloat(values.price) : null,
        duration_minutes: values.duration_minutes ? parseInt(values.duration_minutes) : null,
        is_active: values.is_active,
      });
      form.reset();
      setStep(0);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save service. Please try again.');
    }
  };

  const goNext = () => { if (step < steps.length - 1) setStep(step + 1); };
  const goPrev = () => { if (step > 0) setStep(step - 1); };

  const watchName = form.watch('name');
  const watchPrice = form.watch('price');
  const watchDuration = form.watch('duration_minutes');
  const watchIsActive = form.watch('is_active');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isActive = index === step;
            const isCompleted = index < step;
            return (
              <div key={index} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    "flex flex-col items-center gap-1.5 relative group transition-all",
                    index <= step ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {s.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2", index < step ? "bg-primary" : "bg-muted")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Service Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., General Health Checkup" className="h-12 text-base" autoFocus />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Choose a clear, descriptive name for your service</p>
                  </FormItem>
                )}
              />

            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe what this service includes, what pet owners can expect..."
                        rows={4}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Help pet owners understand what's included in this service</p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        field.value ? "bg-emerald-500/10" : "bg-muted"
                      )}>
                        <Sparkles className={cn("h-5 w-5", field.value ? "text-emerald-600" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <Label htmlFor="active" className="text-base font-medium cursor-pointer">
                          {field.value ? 'Service Active' : 'Service Inactive'}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {field.value ? 'This service is visible to customers' : 'This service is hidden from customers'}
                        </p>
                      </div>
                    </div>
                    <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Service Price (৳)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" placeholder="Enter price in BDT" className="h-12 text-lg font-semibold" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Leave empty if price varies or is negotiable</p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem className="pt-2">
                    <FormLabel className="text-base">Estimated Duration</FormLabel>
                    <p className="text-sm text-muted-foreground mb-3">How long does this service typically take?</p>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_PRESETS.map((preset) => (
                        <Badge
                          key={preset.value}
                          variant={field.value === preset.value ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer px-4 py-2 text-sm transition-all active:scale-95 min-h-[44px] flex items-center",
                            field.value === preset.value ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"
                          )}
                          onClick={() => field.onChange(field.value === preset.value ? '' : preset.value)}
                        >
                          <Clock className="h-3 w-3 mr-1.5" />
                          {preset.label}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-2">
                      <Label htmlFor="custom-duration" className="text-sm text-muted-foreground">Or enter custom duration (minutes)</Label>
                      <FormControl>
                        <Input
                          id="custom-duration"
                          type="number"
                          min="0"
                          max="480"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Custom minutes"
                          className="h-12 mt-1 max-w-[150px]"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Summary Preview */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 mt-4">
                <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{watchName || 'Service Name'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {watchPrice && (
                      <p className="text-primary font-bold">৳{parseFloat(watchPrice).toLocaleString()}</p>
                    )}
                    {watchDuration && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {watchDuration} mins
                      </p>
                    )}
                  </div>
                  <Badge variant={watchIsActive ? "default" : "secondary"} className={cn(
                    "mt-2",
                    watchIsActive && "bg-emerald-500 hover:bg-emerald-500"
                  )}>
                    {watchIsActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <div className="flex gap-2 w-full sm:w-auto">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={goPrev} className="flex-1 sm:flex-none min-h-[44px]">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            {onCancel && step === 0 && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none min-h-[44px]">
                Cancel
              </Button>
            )}
          </div>
          
          {step < steps.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={!canProceed()} className="flex-1 sm:flex-none min-h-[44px]">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isPending || !canProceed()}
              className="flex-1 sm:flex-none min-w-[140px] min-h-[44px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Service' : 'Add Service'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </form>
    </Form>
  );
};

export default AddServiceWizard;
