import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCourses, type CourseCategory, type CourseRow } from '@/hooks/useCourses';
import { CourseCard } from '@/components/academy/CourseCard';
import { CourseSkeleton } from '@/components/academy/CourseSkeleton';
import {
  GraduationCap,
  Search,
  X,
  BookOpen,
  Award,
  Languages,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Shield,
  Users,
  Clock,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import academyHero from '@/assets/shop-hero-agriculture.jpg';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'free', label: 'Free First' },
];

const priceFilters = [
  { value: 'all', label: 'All Prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

// ── Hero carousel showing 1 featured course at a time ─────────────────────────
const CourseHeroCarousel = memo(({ courses }: { courses: CourseRow[] }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const featured = useMemo(() => {
    const withThumb = courses.filter((c) => c.thumbnail_url);
    return (withThumb.length > 0 ? withThumb : courses).slice(0, 5);
  }, [courses]);

  useEffect(() => {
    if (featured.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % featured.length);
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  const goTo = useCallback(
    (idx: number) => {
      setCurrent(idx);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrent((p) => (p + 1) % featured.length);
      }, 3500);
    },
    [featured.length],
  );

  if (featured.length === 0) return null;
  const c = featured[current];
  const isFree = c.price <= 0;

  return (
    <div className="flex gap-3 sm:gap-4 items-center">
      <Link
        to={`/course/${c.id}`}
        className="relative w-[200px] sm:w-[240px] lg:w-[260px] bg-background rounded-2xl border border-border shadow-card overflow-hidden group transition-all hover:shadow-hover"
      >
        <div className="aspect-square overflow-hidden bg-secondary/20">
          {c.thumbnail_url ? (
            <img
              src={c.thumbnail_url}
              alt={c.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="eager"
              decoding="async"
              width={260}
              height={260}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <GraduationCap className="h-16 w-16 text-primary/40" />
            </div>
          )}
          {isFree && (
            <span className="absolute top-3 left-3 bg-success text-success-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
              FREE
            </span>
          )}
          {c.provides_certificate && (
            <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Award className="h-3 w-3" /> Cert
            </span>
          )}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{c.title}</p>
          <div className="flex items-baseline gap-1.5">
            {isFree ? (
              <span className="text-sm sm:text-base font-bold text-success">Free</span>
            ) : (
              <span className="text-sm sm:text-base font-bold text-primary">
                ৳{c.price.toLocaleString()}
              </span>
            )}
            {c.duration_label && (
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" /> {c.duration_label}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-1.5 lg:gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === current
                ? 'w-2.5 h-2.5 bg-primary'
                : 'w-2 h-2 bg-border hover:bg-muted-foreground/40'
            }`}
            aria-label={`Show course ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
});
CourseHeroCarousel.displayName = 'CourseHeroCarousel';

const AcademyPage = () => {
  useDocumentTitle('Academy');
  const [category, setCategory] = useState<CourseCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const debouncedSearch = useDebounce(search, 250);

  const { data: allCourses, isLoading } = useCourses();

  // Category list derived from data + canonical order
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    (allCourses ?? []).forEach((c) => c.category && set.add(c.category));
    return ['all', ...Array.from(set).sort()];
  }, [allCourses]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: allCourses?.length ?? 0 };
    (allCourses ?? []).forEach((c) => {
      if (c.category) map[c.category] = (map[c.category] ?? 0) + 1;
    });
    return map;
  }, [allCourses]);

  const filtered = useMemo(() => {
    let list = allCourses ?? [];
    if (category !== 'all') list = list.filter((c) => c.category === category);
    if (priceFilter === 'free') list = list.filter((c) => c.price <= 0);
    else if (priceFilter === 'paid') list = list.filter((c) => c.price > 0);
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        [c.title, c.description ?? '', c.audience ?? ''].some((t) =>
          t.toLowerCase().includes(q),
        ),
      );
    }
    const sorted = [...list];
    if (sortBy === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === 'free') sorted.sort((a, b) => Number(a.price > 0) - Number(b.price > 0));
    else
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    return sorted;
  }, [allCourses, category, priceFilter, debouncedSearch, sortBy]);

  const totalCourses = allCourses?.length ?? 0;
  const certCount = (allCourses ?? []).filter((c) => c.provides_certificate).length;
  const freeCount = (allCourses ?? []).filter((c) => c.price <= 0).length;

  const activeFiltersCount = [
    category !== 'all',
    priceFilter !== 'all',
    search.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCategory('all');
    setPriceFilter('all');
    setSearch('');
  };

  const academyItemListItems = useMemo(
    () =>
      filtered.slice(0, 10).map((c) => ({
        name: c.title,
        url: `https://zagrotech.lovable.app/course/${c.id}`,
        image: c.thumbnail_url ?? undefined,
        price: c.price,
        priceCurrency: 'BDT',
      })),
    [filtered],
  );

  const formatLabel = (cat: string) =>
    cat === 'all' ? 'All Categories' : cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="bg-muted/30">
      <SEO
        title="Academy — Z Agro Tech"
        description="Expert-led agriculture and farming training cohorts."
        url="https://zagrotech.lovable.app/academy"
        canonicalUrl="https://zagrotech.lovable.app/academy"
        schema={
          academyItemListItems.length > 0
            ? {
                type: 'ItemList',
                name: 'Z Agro Tech Academy — Courses',
                description: 'Expert-led farming training cohorts',
                url: 'https://zagrotech.lovable.app/academy',
                itemListType: 'Course',
                items: academyItemListItems,
              }
            : undefined
        }
      />

      {/* HERO — shop-style background image with overlay */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img
            src={academyHero}
            alt=""
            aria-hidden="true"
            width={1280}
            height={896}
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40 sm:from-background/92 sm:via-background/70 sm:to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-6 sm:py-10 lg:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-5 sm:gap-6">
            {/* Copy column */}
            <div className="space-y-3 sm:space-y-4 sm:col-span-7 lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border border-primary/20 w-fit">
                <GraduationCap className="h-3 w-3" />
                Z Agro Academy
              </span>

              <h1 className="font-bold text-foreground leading-[1.1] tracking-tight text-[1.75rem] sm:text-4xl lg:text-5xl xl:text-6xl">
                Hands-on Training
                <span className="block text-primary mt-1">Cohorts</span>
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed">
                Learn modern farming from certified experts. Live batches, practical curriculum, and a certificate at the end.
              </p>

              {/* Trust strip */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2.5 pt-1">
                <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs font-medium text-foreground bg-background/90 backdrop-blur-sm border border-border rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm">
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{isLoading ? '…' : `${totalCourses} Courses`}</span>
                </span>
                <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs font-medium text-foreground bg-background/90 backdrop-blur-sm border border-border rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm">
                  <Award className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="truncate">{isLoading ? '…' : `${certCount} Certified`}</span>
                </span>
                <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs font-medium text-foreground bg-background/90 backdrop-blur-sm border border-border rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{isLoading ? '…' : `${freeCount} Free`}</span>
                </span>
              </div>
            </div>

            {/* Carousel column */}
            <div className="hidden sm:block sm:col-span-5 lg:col-span-5 relative">
              <CourseHeroCarousel courses={allCourses ?? []} />
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-page-enter"
        role="main"
        aria-label="Academy courses"
      >
        {/* Search, Filter & Sort Bar — shop-styled */}
        <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Row */}
            <div className="flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Search courses, topics, audience..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 sm:h-11 pl-9 sm:pl-11 pr-9 rounded-lg sm:rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base md:text-sm transition-all"
                  aria-label="Search courses"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="sm:hidden h-10 w-10 relative"
                    aria-label={`Filters${activeFiltersCount > 0 ? ` (${activeFiltersCount} active)` : ''}`}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    {activeFiltersCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center"
                        aria-hidden="true"
                      >
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl flex flex-col">
                  <SheetHeader className="text-left flex-shrink-0">
                    <SheetTitle className="text-lg">Filters & Sort</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-5 overflow-y-auto flex-1 pb-6 -mx-1 px-1">
                    <div className="space-y-2.5">
                      <h3 className="font-semibold text-foreground text-sm">Category</h3>
                      <div className="flex flex-wrap gap-2">
                        {categoryOptions.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategory(cat as CourseCategory | 'all')}
                            className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-full transition-all active:scale-95 ${
                              category === cat
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            aria-pressed={category === cat}
                          >
                            {formatLabel(cat)} {counts[cat] ? `(${counts[cat]})` : ''}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2.5">
                      <h3 className="font-semibold text-foreground text-sm">Price</h3>
                      <div className="flex flex-wrap gap-2">
                        {priceFilters.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setPriceFilter(opt.value as 'all' | 'free' | 'paid')}
                            className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-full transition-all active:scale-95 ${
                              priceFilter === opt.value
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            aria-pressed={priceFilter === opt.value}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2.5">
                      <h3 className="font-semibold text-foreground text-sm">Sort By</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {sortOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-xl transition-all text-left active:scale-95 ${
                              sortBy === opt.value
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            aria-pressed={sortBy === opt.value}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <Button variant="outline" onClick={clearFilters} className="w-full min-h-[44px]">
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Filters Row */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={category} onValueChange={(v) => setCategory(v as CourseCategory | 'all')}>
                  <SelectTrigger className="w-[180px] h-10 rounded-lg" aria-label="Category filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {formatLabel(cat)}
                        {counts[cat] ? ` (${counts[cat]})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={priceFilter}
                  onValueChange={(v) => setPriceFilter(v as 'all' | 'free' | 'paid')}
                >
                  <SelectTrigger className="w-[140px] h-10 rounded-lg" aria-label="Price filter">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceFilters.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    Clear ({activeFiltersCount})
                  </Button>
                )}
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-10 rounded-lg" aria-label="Sort by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Result count */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'course' : 'courses'}
              {category !== 'all' && (
                <>
                  {' '}in{' '}
                  <span className="font-medium text-foreground">{formatLabel(category)}</span>
                </>
              )}
              {debouncedSearch && (
                <>
                  {' '}matching "
                  <span className="font-medium text-foreground">{debouncedSearch}</span>"
                </>
              )}
            </p>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <CourseSkeleton key={i} />)
            : filtered.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border/60 mt-4">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            {totalCourses === 0 ? (
              <>
                <h3 className="font-semibold text-foreground">New cohorts launching soon</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  We're preparing our next batch of expert-led farming masterclasses. Check back shortly or browse the shop for agri-supplies in the meantime.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-foreground">No matching courses</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Try a different category or clear your search — new cohorts open regularly.
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                    Reset filters
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AcademyPage;
