import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClinicVerificationSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Skeleton className="h-16 w-16 rounded-xl mx-auto mb-4" />
          <Skeleton className="h-7 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Owner Info */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-36" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>

            {/* Clinic Info */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-36" />
              {[1, 2].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-24 w-full rounded-lg border-2 border-dashed border-border" />
              <Skeleton className="h-24 w-full rounded-lg border-2 border-dashed border-border" />
            </div>

            {/* Submit */}
            <Skeleton className="h-11 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
