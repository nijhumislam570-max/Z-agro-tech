import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { getDivisions, getDistricts, getThanas } from '@/lib/bangladeshRegions';
import { useProfile, type ProfileRow } from '@/hooks/useProfile';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileRow | null;
}

const EditProfileSheet = ({ open, onOpenChange, profile }: Props) => {
  const { updateProfile, saving } = useProfile();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [division, setDivision] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [thana, setThana] = useState<string>('');

  // Reset form when sheet opens with current profile.
  useEffect(() => {
    if (open) {
      setFullName(profile?.full_name ?? '');
      setPhone(profile?.phone ?? '');
      setAddress(profile?.address ?? '');
      setDivision(profile?.division ?? '');
      setDistrict(profile?.district ?? '');
      setThana(profile?.thana ?? '');
    }
  }, [open, profile]);

  const divisions = useMemo(() => getDivisions(), []);
  const districts = useMemo(() => (division ? getDistricts(division) : []), [division]);
  const thanas = useMemo(
    () => (division && district ? getThanas(division, district) : []),
    [division, district],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateProfile({
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      division: division || null,
      district: district || null,
      thana: thana || null,
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone</Label>
            <Input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-division">Division</Label>
            <Select
              value={division || undefined}
              onValueChange={(v) => { setDivision(v); setDistrict(''); setThana(''); }}
            >
              <SelectTrigger id="profile-division">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-district">District</Label>
            <Select
              value={district || undefined}
              onValueChange={(v) => { setDistrict(v); setThana(''); }}
              disabled={!division}
            >
              <SelectTrigger id="profile-district">
                <SelectValue placeholder={division ? 'Select district' : 'Select division first'} />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-thana">Thana</Label>
            <Select
              value={thana || undefined}
              onValueChange={setThana}
              disabled={!district}
            >
              <SelectTrigger id="profile-thana">
                <SelectValue placeholder={district ? 'Select thana' : 'Select district first'} />
              </SelectTrigger>
              <SelectContent>
                {thanas.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-address">Street address</Label>
            <Input
              id="profile-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, road, area"
              autoComplete="street-address"
            />
          </div>

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
      </SheetContent>
    </Sheet>
  );
};

export default EditProfileSheet;
