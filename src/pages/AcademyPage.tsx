import { useState, useMemo } from 'react';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCourses, type CourseCategory } from '@/hooks/useCourses';
import { useCoursesNextBatches } from '@/hooks/useCourseNextBatch';
import { CourseCard } from '@/components/academy/CourseCard';
import { CourseSkeleton } from '@/components/academy/CourseSkeleton';
import { CourseCategoryChips } from '@/components/academy/CourseCategoryChips';
import { GraduationCap, Search, X, BookOpen, Award, Languages, Sparkles, Users, PlayCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { BRAND_STATS } from '@/lib/brandStats';

const AcademyPage = () => {
  // SEO component owns <title>; no need for useDocumentTitle here.
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

  // Batched fetch for "next batch" badges across the visible grid — replaces
  // per-card useCourseBatches() N+1.
  const visibleIds = useMemo(() => filtered.map((c) => c.id), [filtered]);
  const { data: nextBatches } = useCoursesNextBatches(visibleIds);

  // ItemList schema from top 10 visible (filtered) courses for academy SEO
  const academyItemListItems = useMemo(
    () =>
      filtered.slice(0, 10).map((c) => ({
        name: c.title,
        url: `/course/${c.id}`,
        image: c.thumbnail_url ?? undefined,
        price: c.price,
        priceCurrency: 'BDT',
      })),
    [filtered],
  );

  return (
    <>
      <SEO
        title="Academy — Z Agro Tech"
        description="Expert-led agriculture and farming training cohorts."
        url="/academy"
        canonicalUrl="/academy"
        schema={
          academyItemListItems.length > 0
            ? {
                type: 'ItemList',
                name: 'Z Agro Tech Academy — Courses',
                description: 'Expert-led farming training cohorts',
                url: '/academy',
                itemListType: 'Course',
                items: academyItemListItems,
              }
            : undefined
        }
      />
      <main id="main-content" className="flex-1 animate-page-enter">
        {/* HERO — richer, asymmetric, with depth */}
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 via-background to-background">
          {/* Decorative background shapes */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
            <div
              className="hidden md:block absolute top-16 right-[8%] w-14 h-14 bg-primary/15 animate-float"
              style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)', animationDelay: '0s' }}
            />
            <div
              className="hidden md:block absolute bottom-20 left-[6%] w-12 h-12 bg-accent/20 animate-float"
              style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', animationDelay: '1.2s' }}
            />
            <div className="hidden md:block absolute top-1/3 left-[10%] w-9 h-9 bg-success/20 rotate-45 animate-float" style={{ animationDelay: '0.6s' }} />
            <div className="hidden md:block absolute bottom-32 right-[14%] w-7 h-7 rounded-full bg-warning/30 animate-float" style={{ animationDelay: '1.8s' }} />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20 relative z-10">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* LEFT: copy + CTA + search */}
              <div className="lg:col-span-7 text-center lg:text-left">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/90 backdrop-blur border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary shadow-soft animate-fade-in"
                  style={{ animationDelay: '60ms', animationFillMode: 'both' }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  <GraduationCap className="h-3.5 w-3.5" />
                  Z Agro Academy
                </div>

                <h1
                  className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground animate-slide-up"
                  style={{ animationDelay: '120ms', animationFillMode: 'both' }}
                >
                  Master modern{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-primary to-[hsl(142,45%,40%)] bg-clip-text text-transparent">
                      farming
                    </span>
                    <span
                      className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/30 rounded-full -z-0"
                      aria-hidden="true"
                    />
                  </span>{' '}
                  with experts
                </h1>

                <p
                  className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in"
                  style={{ animationDelay: '200ms', animationFillMode: 'both' }}
                >
                  Live cohorts, hands-on curriculum, and certificates from{' '}
                  <span className="font-semibold text-foreground">certified agronomists</span>.
                  Learn at your pace, in your language.
                </p>

                <ul
                  className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto lg:mx-0 animate-fade-in"
                  style={{ animationDelay: '260ms', animationFillMode: 'both' }}
                >
                  {[
                    'Live + recorded sessions',
                    'Practical field assignments',
                    'Industry-recognized certificate',
                    'Lifetime curriculum access',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/85">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-6 relative max-w-xl mx-auto lg:mx-0 animate-fade-in"
                  style={{ animationDelay: '320ms', animationFillMode: 'both' }}
                >
                  <div className="relative flex items-center bg-card rounded-full shadow-lg border border-border/60 p-1.5 focus-within:ring-2 focus-within:ring-primary/30 transition">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search courses, topics, audience..."
                      className="pl-11 pr-2 h-11 border-0 bg-transparent rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-sm"
                      aria-label="Search courses"
                    />
                    {search ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearch('')}
                        className="h-9 w-9 rounded-full shrink-0"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 rounded-full px-4 gap-1 shrink-0 hidden sm:inline-flex"
                        onClick={() =>
                          document.getElementById('course-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      >
                        Browse
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div
                  className="mt-6 flex flex-col sm:flex-row items-center lg:items-start gap-4 sm:gap-6 justify-center lg:justify-start animate-fade-in"
                  style={{ animationDelay: '380ms', animationFillMode: 'both' }}
                >
                  <div className="flex -space-x-2.5">
                    {[
                      'hsl(142,55%,28%)',
                      'hsl(38,70%,50%)',
                      'hsl(160,60%,35%)',
                      'hsl(200,50%,55%)',
                    ].map((bg, i) => (
                      <div
                        key={i}
                        className="h-9 w-9 rounded-full border-2 border-background shadow-sm flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: bg }}
                        aria-hidden="true"
                      >
                        {['R', 'M', 'A', 'S'][i]}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{BRAND_STATS.farmers.value} farmers</span> learning with us
                    <div className="flex items-center gap-1 mt-0.5 justify-center lg:justify-start">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="text-accent text-sm">★</span>
                      ))}
                      <span className="text-xs ml-1">4.9 average rating</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: layered stat card composition */}
              <div className="lg:col-span-5">
                <div className="relative max-w-md mx-auto lg:max-w-none">
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-accent/20 rotate-12 hidden sm:block" aria-hidden="true" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-primary/15 hidden sm:block" aria-hidden="true" />

                  <div className="relative bg-card/95 backdrop-blur-md border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            Academy at a glance
                          </p>
                          <p className="text-sm font-display font-bold text-foreground leading-none mt-0.5">
                            Live numbers
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-success bg-success-light px-2 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        Live
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { icon: BookOpen, value: isLoading ? '—' : totalCourses, label: 'Courses', tone: 'primary' as const },
                        { icon: Award, value: isLoading ? '—' : certCount, label: 'Certified', tone: 'accent' as const },
                        { icon: Languages, value: isLoading ? '—' : freeCount, label: 'Free', tone: 'success' as const },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="relative rounded-2xl bg-gradient-to-br from-secondary/40 to-background border border-border/60 p-3 text-center hover:-translate-y-0.5 hover:shadow-md transition-all"
                        >
                          <div
                            className={`mx-auto mb-1.5 h-8 w-8 rounded-xl flex items-center justify-center ${
                              s.tone === 'primary'
                                ? 'bg-primary/10 text-primary'
                                : s.tone === 'accent'
                                  ? 'bg-accent/15 text-accent'
                                  : 'bg-success-light text-success'
                            }`}
                          >
                            <s.icon className="h-4 w-4" />
                          </div>
                          <p className="text-xl sm:text-2xl font-display font-bold text-foreground leading-none">
                            {s.value}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">
                            {s.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground leading-none">{BRAND_STATS.farmers.value}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{BRAND_STATS.farmers.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-accent shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground leading-none">{BRAND_STATS.satisfaction.value}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{BRAND_STATS.satisfaction.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category chips strip */}
            <div className="mt-8 sm:mt-10">
              <CourseCategoryChips value={category} onChange={setCategory} counts={counts} />
            </div>
          </div>
        </section>

        {/* GRID */}
        <section id="course-grid" className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 scroll-mt-24">
          {!isLoading && (
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                {filtered.length === 1 ? 'course' : 'courses'}
                {category !== 'all' && (
                  <>
                    {' '}
                    in <span className="font-medium text-foreground capitalize">
                      {category.replace(/_/g, ' ')}
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CourseSkeleton key={i} />)
              : filtered.map((c) => (
                  <CourseCard key={c.id} course={c} nextBatch={nextBatches?.get(c.id) ?? null} />
                ))}
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
    </>
  );
};

export default AcademyPage;
