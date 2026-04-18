import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCourse } from '@/hooks/useCourses';
import { useEnroll, useIsEnrolled } from '@/hooks/useEnrollments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, PlayCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: course, isLoading } = useCourse(id);
  const { data: isEnrolled } = useIsEnrolled(id);
  const enroll = useEnroll();

  useDocumentTitle(course?.title ?? 'Course');

  const handleEnroll = () => {
    if (!user) { navigate('/auth'); return; }
    if (id) enroll.mutate(id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={course?.title ?? 'Course'} description={course?.description ?? ''} url={`/course/${id}`} />
      <Navbar />
      <main id="main-content" className="flex-1 container mx-auto px-4 sm:px-6 py-8">
        <Link to="/academy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Academy
        </Link>

        {isLoading ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 aspect-video w-full rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : !course ? (
          <Card className="py-16 text-center">
            <CardContent>
              <p className="text-muted-foreground">Course not found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap className="h-24 w-24 text-primary/30" />
                )}
              </div>
              <div>
                <Badge variant="outline" className="capitalize mb-3">{course.difficulty}</Badge>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">{course.title}</h1>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {course.description ?? 'No description provided.'}
                </p>
              </div>
            </div>

            <aside className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Price</p>
                    <p className="text-3xl font-bold text-primary">
                      {course.price > 0 ? `৳${course.price}` : 'Free'}
                    </p>
                  </div>
                  {isEnrolled ? (
                    <div className="rounded-xl bg-success/10 border border-success/30 p-4 flex items-center gap-3 text-success">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm font-medium">You're enrolled in this course</p>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full gap-2"
                      onClick={handleEnroll}
                      disabled={enroll.isPending}
                    >
                      <PlayCircle className="h-4 w-4" />
                      {enroll.isPending ? 'Enrolling…' : user ? 'Enroll now' : 'Sign in to enroll'}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Lifetime access · Self-paced learning
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CourseDetailPage;
