import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { getDivisions, getDistricts, getThanas } from '@/lib/bangladeshRegions';
import { useProfile, type ProfileRow } from '@/hooks/useProfile';
import { profileSchema, type ProfileFormData } from '@/lib/validations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileRow | null;
}

const emptyValues: ProfileFormData = {
  full_name: '',
  phone: '',
  address: '',
  division: '',
  district: '',
  thana: '',
};

const EditProfileSheet = ({ open, onOpenChange, profile }: Props) => {
  const { updateProfile, saving } = useProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: emptyValues,
    mode: 'onChange',
  });

  // Reset form whenever sheet opens with current profile values.
  useEffect(() => {
    if (open) {
      form.reset({
        full_name: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        address: profile?.address ?? '',
        division: profile?.division ?? '',
        district: profile?.district ?? '',
        thana: profile?.thana ?? '',
      });
    }
  }, [open, profile, form]);

  const division = form.watch('division') ?? '';
  const district = form.watch('district') ?? '';

  const divisions = useMemo(() => getDivisions(), []);
  const districts = useMemo(() => (division ? getDistricts(division) : []), [division]);
  const thanas = useMemo(
    () => (division && district ? getThanas(division, district) : []),
    [division, district],
  );

  const onSubmit = async (values: ProfileFormData) => {
    const ok = await updateProfile({
      full_name: values.full_name?.trim() || null,
      phone: values.phone?.trim() || null,
      address: values.address?.trim() || null,
      division: values.division || null,
      district: values.district || null,
      thana: values.thana || null,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Keep your delivery details up to date for faster checkout.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type="tel"
                      inputMode="tel"
                      placeholder="01XXXXXXXXX"
                      autoComplete="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="division"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('district', '');
                      form.setValue('thana', '');
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {divisions.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('thana', '');
                    }}
                    disabled={!division}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={division ? 'Select district' : 'Select division first'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thana</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={!district}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={district ? 'Select thana' : 'Select district first'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {thanas.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="House, road, area"
                      autoComplete="street-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default EditProfileSheet;
