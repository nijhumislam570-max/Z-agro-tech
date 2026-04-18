import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCourses } from '@/hooks/useCourses';
import { CourseCard } from '@/components/academy/CourseCard';
import { CourseSkeleton } from '@/components/academy/CourseSkeleton';
import { GraduationCap } from 'lucide-react';

const AcademyPage = () => {
  useDocumentTitle('Academy');
  const { data: courses, isLoading } = useCourses();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Academy — Z Agro Tech" description="Expert-led agriculture and farming courses." url="/academy" />
      <Navbar />
      <main id="main-content" className="flex-1 @container">
        <section className="bg-gradient-to-b from-secondary/40 to-background py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <GraduationCap className="h-3.5 w-3.5" /> Z Agro Academy
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
              Learn modern farming
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Curated courses by industry experts to help you grow smarter, faster, and more sustainably.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-4 sm:gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CourseSkeleton key={i} />)
              : (courses || []).map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
          {!isLoading && (!courses || courses.length === 0) && (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/60 mt-4">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No courses available yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back soon — new courses are added regularly.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AcademyPage;
