import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';

export function DoctorVerificationSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-20 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="py-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>

        {/* Personal Info Card */}
        <Card className="mb-6">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Professional Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Card */}
        <Card className="mb-6">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-28 w-full rounded-xl border-2 border-dashed border-border" />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </main>
      <MobileNav />
    </div>
  );
}
