import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, MapPin, Phone, User as UserIcon, Sparkles } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import EditProfileSheet from './EditProfileSheet';

const Field = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) => (
  <div className="flex items-start gap-3">
    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {value ? (
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground/70">Not set</p>
      )}
    </div>
  </div>
);

const ProfileTab = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const [editOpen, setEditOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const initial = (profile?.full_name ?? user?.email ?? 'U').charAt(0).toUpperCase();
  const addressLine = [profile?.thana, profile?.district, profile?.division]
    .filter(Boolean)
    .join(', ') || null;

  // True only when none of the meaningful fields are filled.
  const hasNothing = !profile?.full_name && !profile?.phone && !profile?.address && !profile?.division;

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-16 w-16">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-lg font-display font-semibold text-foreground truncate">
                  {profile?.full_name ?? 'Welcome'}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-2 flex-shrink-0">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>

          {hasNothing && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">Complete your profile</p>
                <p className="text-xs text-muted-foreground">
                  Add your phone and delivery address to make checkout faster.
                </p>
                <Button size="sm" onClick={() => setEditOpen(true)}>Get started</Button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={UserIcon} label="Full name" value={profile?.full_name ?? null} />
            <Field icon={Phone} label="Phone" value={profile?.phone ?? null} />
            <Field icon={MapPin} label="Region" value={addressLine} />
            <Field icon={MapPin} label="Street address" value={profile?.address ?? null} />
          </div>
        </CardContent>
      </Card>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} profile={profile} />
    </>
  );
};

export default ProfileTab;
