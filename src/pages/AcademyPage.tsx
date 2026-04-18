import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCourses, type CourseCategory } from '@/hooks/useCourses';
import { CourseCard } from '@/components/academy/CourseCard';
import { CourseSkeleton } from '@/components/academy/CourseSkeleton';
import { CourseCategoryChips } from '@/components/academy/CourseCategoryChips';
import { GraduationCap, Search, X, BookOpen, Award, Languages } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const AcademyPage = () => {
  useDocumentTitle('Academy');
  const [category, setCategory] = useState<CourseCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  // Load all active courses once for counts/search; filter client-side.
  const { data: allCourses, isLoading } = useCourses();

  const counts = useMemo(() => {
    const map: Partial<Record<CourseCategory | 'all', number>> = { all: allCourses?.length ?? 0 };
    (allCourses ?? []).forEach((c) => {
      map[c.category] = (map[c.category] ?? 0) + 1;
    });
    return map;
  }, [allCourses]);

  const filtered = useMemo(() => {
    let list = allCourses ?? [];
    if (category !== 'all') list = list.filter((c) => c.category === category);
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        [c.title, c.description ?? '', c.audience ?? ''].some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allCourses, category, debouncedSearch]);

  const totalCourses = allCourses?.length ?? 0;
  const certCount = (allCourses ?? []).filter((c) => c.provides_certificate).length;
  const freeCount = (allCourses ?? []).filter((c) => c.price <= 0).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Academy — Z Agro Tech"
        description="Expert-led agriculture and farming training cohorts."
        url="/academy"
      />
      <Navbar />
      <main id="main-content" className="flex-1 @container animate-page-enter">
        {/* HERO */}
        <section className="bg-gradient-to-b from-secondary/40 to-background py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <GraduationCap className="h-3.5 w-3.5" /> Z Agro Academy
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
              Hands-on training cohorts
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Learn modern farming from certified experts. Live batches, practical curriculum, and a
              certificate at the end.
            </p>

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto mb-6">
              <div className="rounded-xl bg-card border border-border/60 p-2.5 sm:p-3">
                <BookOpen className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-base sm:text-lg font-bold text-foreground leading-none">
                  {isLoading ? '—' : totalCourses}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Courses</p>
              </div>
              <div className="rounded-xl bg-card border border-border/60 p-2.5 sm:p-3">
                <Award className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-base sm:text-lg font-bold text-foreground leading-none">
                  {isLoading ? '—' : certCount}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Certified</p>
              </div>
              <div className="rounded-xl bg-card border border-border/60 p-2.5 sm:p-3">
                <Languages className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-base sm:text-lg font-bold text-foreground leading-none">
                  {isLoading ? '—' : freeCount}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Free</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md mx-auto mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses, topics, audience..."
                className="pl-9 pr-9 h-11 rounded-full bg-card"
                aria-label="Search courses"
              />
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearch('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <CourseCategoryChips value={category} onChange={setCategory} counts={counts} />
          </div>
        </section>

        {/* GRID */}
        <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {!isLoading && (
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                {filtered.length === 1 ? 'course' : 'courses'}
                {category !== 'all' && (
                  <>
                    {' '}
                    in <span className="font-medium text-foreground capitalize">
                      {category.replace('_', ' ')}
                    </span>
                  </>
                )}
                {debouncedSearch && (
                  <>
                    {' '}
                    matching "<span className="font-medium text-foreground">{debouncedSearch}</span>"
                  </>
                )}
              </p>
              {(category !== 'all' || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategory('all');
                    setSearch('');
                  }}
                  className="text-xs h-8"
                >
                  Reset
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-4 sm:gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CourseSkeleton key={i} />)
              : filtered.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/60 mt-4">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              {totalCourses === 0 ? (
                <>
                  <h3 className="font-semibold text-foreground">New cohorts launching soon</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    We're preparing our next batch of expert-led farming masterclasses. Check back shortly or
                    browse the shop for agri-supplies in the meantime.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-foreground">No matching courses</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Try a different category or clear your search — new cohorts open regularly.
                  </p>
                  {(category !== 'all' || search) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCategory('all');
                        setSearch('');
                      }}
                      className="mt-4"
                    >
                      Reset filters
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AcademyPage;
