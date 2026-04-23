import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useCourse, COURSE_CATEGORIES, COURSE_MODES } from '@/hooks/useCourses';
import { useCourseBatches } from '@/hooks/useCourseBatches';
import { useIsEnrolled } from '@/hooks/useEnrollments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap, ArrowLeft, CheckCircle2, Award, Clock, MapPin, Users, Sparkles,
} from 'lucide-react';
import { CurriculumList } from '@/components/academy/CurriculumList';
import { BatchPicker } from '@/components/academy/BatchPicker';
import { EnrollDialog } from '@/components/academy/EnrollDialog';
import { CoursePlayer } from '@/components/academy/CoursePlayer';
import { Progress } from '@/components/ui/progress';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: course, isLoading } = useCourse(id);
  const { data: batches } = useCourseBatches(id);
  const { data: enrollment } = useIsEnrolled(id);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);

  // SEO component owns the document title; useDocumentTitle would double-write it.

  const categoryLabel = useMemo(
    () => COURSE_CATEGORIES.find((c) => c.value === course?.category)?.label ?? null,
    [course?.category],
  );
  const modeLabel = useMemo(
    () => COURSE_MODES.find((m) => m.value === course?.mode)?.label ?? null,
    [course?.mode],
  );

  const activeBatch = batches?.find((b) => b.id === selectedBatch) ?? null;
  const hasOpenBatch = batches?.some((b) => b.status === 'open' || b.status === 'filling') ?? false;
  // Cancelled enrollments shouldn't lock the user out — treat them as "not enrolled"
  // so the Enroll CTA returns. Only pending/confirmed/completed count as "enrolled".
  const activeEnrollment = enrollment && enrollment.status !== 'cancelled' ? enrollment : null;

  return (
    <>
      <SEO
        title={course?.title ?? 'Course'}
        description={course?.description ?? 'Expert-led farming course on Z Agro Tech Academy.'}
        image={course?.thumbnail_url ?? undefined}
        url={`https://zagrotech.lovable.app/course/${id}`}
        canonicalUrl={`https://zagrotech.lovable.app/course/${id}`}
        schema={course ? [
          {
            type: 'Course',
            name: course.title,
            description: course.description ?? undefined,
            image: course.thumbnail_url ?? undefined,
            url: `https://zagrotech.lovable.app/course/${id}`,
            price: course.price,
            priceCurrency: 'BDT',
            language: course.language ?? 'en',
            difficulty: course.difficulty,
            duration: course.duration_label ?? undefined,
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: 'https://zagrotech.lovable.app/' },
              { name: 'Academy', url: 'https://zagrotech.lovable.app/academy' },
              { name: course.title, url: `https://zagrotech.lovable.app/course/${id}` },
            ],
          },
        ] : undefined}
      />
      <main id="main-content" className="flex-1 container mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8 animate-page-enter">
        <Link to="/academy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Academy
        </Link>

        {isLoading ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 aspect-video w-full rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : !course ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-display font-bold text-foreground">Course not found</h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  This course may have been removed or the link is incorrect. Browse the Academy to discover other expert-led farming courses.
                </p>
              </div>
              <Link to="/academy" className="inline-block">
                <Button className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Academy</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* MAIN */}
            <div className="lg:col-span-2 space-y-6">
              <CoursePlayer
                videoUrl={course.video_url}
                thumbnailUrl={course.thumbnail_url}
                title={course.title}
              />

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {categoryLabel && <Badge variant="secondary">{categoryLabel}</Badge>}
                  <Badge variant="outline" className="capitalize">{course.difficulty}</Badge>
                  {course.duration_label && (
                    <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{course.duration_label}</Badge>
                  )}
                  {modeLabel && (
                    <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{modeLabel}</Badge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">{course.title}</h1>
                {course.audience && (
                  <p className="text-base text-muted-foreground italic">For: {course.audience}</p>
                )}
                {course.description && (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{course.description}</p>
                )}
              </div>

              {course.curriculum.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> What you'll learn
                  </h2>
                  <CurriculumList items={course.curriculum} />
                </div>
              )}

              {course.provides_certificate && (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Award className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Certificate of completion</p>
                      <p className="text-sm text-muted-foreground">Earn an industry-recognized certificate after finishing the course.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Course fee</p>
                    <p className="text-3xl font-bold text-primary">
                      {course.price > 0 ? `৳${course.price}` : 'Free'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> Available batches
                    </p>
                    <BatchPicker
                      batches={batches ?? []}
                      selectedId={selectedBatch}
                      onSelect={setSelectedBatch}
                    />
                  </div>

                  {activeEnrollment ? (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-success/10 border border-success/30 p-4 flex items-center gap-3 text-success">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">
                          {activeEnrollment.status === 'pending' ? "Request received — we'll be in touch" : "You're enrolled in this course"}
                        </p>
                      </div>
                      {activeEnrollment.status !== 'pending' && (
                        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Your progress</span>
                            <span className="font-bold text-primary">{activeEnrollment.progress ?? 0}%</span>
                          </div>
                          <Progress value={activeEnrollment.progress ?? 0} className="h-2" aria-label="Course completion" />
                          <p className="text-xs text-muted-foreground">
                            {(activeEnrollment.progress ?? 0) >= 100 ? 'Course completed — well done!' : 'Keep learning to reach 100%.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => setEnrollOpen(true)}
                        disabled={!hasOpenBatch && (batches?.length ?? 0) > 0}
                      >
                        Enroll now
                      </Button>
                      {(batches?.length ?? 0) === 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          No fixed batches — we'll match you to the next start date.
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Live cohort · Certificate included
                  </p>
                </CardContent>
              </Card>
            </aside>

            <EnrollDialog
              open={enrollOpen}
              onOpenChange={setEnrollOpen}
              course={course}
              batch={activeBatch}
            />
          </div>
        )}
      </main>
    </>
  );
};

export default CourseDetailPage;
