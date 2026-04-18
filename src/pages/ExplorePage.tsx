import { useCallback, useMemo, memo } from 'react';
import type { PetFollowData } from '@/hooks/useExplorePets';
import type { Pet } from '@/types/social';
import { Search, X, MapPin, Sparkles, PawPrint } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  SheetClose,
} from '@/components/ui/sheet';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useExplorePets } from '@/hooks/useExplorePets';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import ExplorePetCard from '@/components/explore/ExplorePetCard';
import { PetGridSkeleton, PetCardSkeleton } from '@/components/explore/PetCardSkeleton';

const speciesOptions = ['All', 'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Other'];

const speciesEmojis: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐱',
  Bird: '🐦',
  Fish: '🐠',
  Rabbit: '🐰',
  Hamster: '🐹',
  Other: '🐾',
};

const PetCards = memo(({ pets, followDataMap, onFollow, onUnfollow }: {
  pets: Pet[];
  followDataMap: Record<string, PetFollowData>;
  onFollow: (petId: string) => void;
  onUnfollow: (petId: string) => void;
}) => {
  const cards = useMemo(() => pets.map((pet, index) => (
    <div
      key={pet.id}
      className="animate-fade-in"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <ExplorePetCard
        pet={pet}
        followData={followDataMap[pet.id] || { followersCount: 0, isFollowing: false }}
        onFollow={onFollow}
        onUnfollow={onUnfollow}
      />
    </div>
  )), [pets, followDataMap, onFollow, onUnfollow]);

  return (
    <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {cards}
    </div>
  );
});
PetCards.displayName = 'PetCards';

const ExplorePage = () => {
  useDocumentTitle('Explore Pets');

  const {
    pets,
    followDataMap,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    species,
    setSpecies,
    location,
    setLocation,
    handleSearch,
    clearFilters,
    hasActiveFilters,
    optimisticFollow,
    optimisticUnfollow,
    loadMore,
  } = useExplorePets();

  const { sentinelRef } = useInfiniteScroll(loadMore, {
    isLoading: loading || loadingMore,
    hasMore,
    threshold: 300,
  });

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  }, [setLocation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const activeFilterCount = [searchQuery, species !== 'All' ? species : null, location].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />

      {/* Hero Header Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/20 border-b border-border/50">
        <div className="absolute inset-0 paw-pattern opacity-30" aria-hidden="true" />
        <div className="container mx-auto px-4 py-6 sm:py-10 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-3 sm:mb-4">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Discover Amazing Pets
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
              Explore <span className="text-gradient">Pets</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Find and connect with adorable pets from your community
            </p>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6" role="main" aria-label="Explore pets">
        <div className="max-w-5xl mx-auto">

          {/* Search & Filters - Sticky on Mobile */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0 sm:py-0 sm:mb-6 border-b sm:border-none border-border/50">
            <div className="flex flex-col gap-3">
              {/* Search Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Search pets by name or breed..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-11 sm:h-10 bg-card border-border/50 focus-visible:ring-primary/30"
                    aria-label="Search pets"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="btn-primary h-11 sm:h-10 px-4 sm:px-6"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>

              {/* Filter Row */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-1.5 sm:gap-2">
                  {speciesOptions.slice(0, 5).map((s) => (
                    <Button
                      key={s}
                      variant={species === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSpecies(s)}
                      className={`shrink-0 h-9 text-xs sm:text-sm ${
                        species === s
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card hover:bg-secondary'
                      }`}
                    >
                      {s !== 'All' && <span className="mr-1">{speciesEmojis[s]}</span>}
                      {s}
                    </Button>
                  ))}
                </div>

                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger className="w-auto h-9 shrink-0 bg-card border-border/50 text-xs sm:text-sm">
                    <span className="flex items-center gap-1">
                      <PawPrint className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">More</span>
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s !== 'All' && <span className="mr-2">{speciesEmojis[s]}</span>}
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`shrink-0 h-9 gap-1.5 bg-card border-border/50 ${
                        location ? 'border-primary text-primary' : ''
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{location || 'Location'}</span>
                      {location && <span className="sm:hidden">📍</span>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-2xl">
                    <SheetHeader className="pb-4">
                      <SheetTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Filter by Location
                      </SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter city or region..."
                        value={location}
                        onChange={handleLocationChange}
                        className="h-12"
                        aria-label="Filter by location"
                      />
                      <div className="flex gap-2">
                        <SheetClose asChild>
                          <Button
                            variant="outline"
                            className="flex-1 h-12"
                            onClick={() => setLocation('')}
                          >
                            Clear
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            onClick={handleSearch}
                            className="flex-1 h-12 btn-primary"
                          >
                            Apply Filter
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 py-3 sm:py-4">
              <span className="text-xs text-muted-foreground">Active:</span>
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 pl-2.5 pr-1.5 py-1 bg-primary/10 text-primary border-0 hover:bg-primary/20 cursor-pointer"
                  onClick={() => { setSearchQuery(''); handleSearch(); }}
                >
                  <Search className="h-3 w-3" />
                  "{searchQuery}"
                  <X className="h-3 w-3 ml-0.5" />
                </Badge>
              )}
              {species !== 'All' && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 pl-2.5 pr-1.5 py-1 bg-accent/10 text-accent border-0 hover:bg-accent/20 cursor-pointer"
                  onClick={() => setSpecies('All')}
                >
                  {speciesEmojis[species]} {species}
                  <X className="h-3 w-3 ml-0.5" />
                </Badge>
              )}
              {location && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 pl-2.5 pr-1.5 py-1 bg-secondary text-secondary-foreground border-0 hover:bg-secondary/80 cursor-pointer"
                  onClick={() => { setLocation(''); handleSearch(); }}
                >
                  <MapPin className="h-3 w-3" />
                  {location}
                  <X className="h-3 w-3 ml-0.5" />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Results Count */}
          {!loading && pets.length > 0 && (
            <div className="flex items-center justify-between py-2 sm:py-3">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{pets.length}</span> pets
                {hasActiveFilters && ' matching your filters'}
              </p>
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <PetGridSkeleton count={6} />
          ) : pets.length === 0 ? (
            <Card className="border-dashed border-2 bg-card/50">
              <CardContent className="py-12 sm:py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <PawPrint className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No pets found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  We couldn't find any pets matching your search. Try adjusting your filters or search terms.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-2">
                    <X className="h-4 w-4 mr-2" />
                    Clear all filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <PetCards
                pets={pets}
                followDataMap={followDataMap}
                onFollow={optimisticFollow}
                onUnfollow={optimisticUnfollow}
              />

              {loadingMore && (
                <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <PetCardSkeleton key={i} />
                  ))}
                </div>
              )}

              <div ref={sentinelRef} className="h-1" aria-hidden="true" />

              {!hasMore && pets.length > 0 && (
                <p className="text-center text-muted-foreground text-xs py-6">You've seen all pets 🐾</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
