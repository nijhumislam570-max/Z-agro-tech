import { useState, useEffect, useCallback, memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StoriesBar } from '@/components/social/StoriesBar';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { PostCard } from '@/components/social/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Users, Globe, PawPrint, 
  ArrowRight, Sparkles, Search, MessageCircle, 
  TrendingUp
} from 'lucide-react';
import type { Pet } from '@/types/social';
import FeaturedProducts from '@/components/FeaturedProducts';

const BelowFoldContent = () => {
  const { user } = useAuth();
  const { pets } = usePets();
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  const [trendingPets, setTrendingPets] = useState<Pet[]>([]);
  
  const { 
    posts, 
    loading, 
    likePost, 
    unlikePost, 
    refreshPosts,
    updatePostCommentCount
  } = usePosts(undefined, feedType);

  const handleFeedTypeChange = useCallback((v: string) => {
    setFeedType(v as 'all' | 'following');
  }, []);

  const handleLike = useCallback((id: string) => likePost(id), [likePost]);
  const handleUnlike = useCallback((id: string) => unlikePost(id), [unlikePost]);
  const handleRefresh = useCallback(() => refreshPosts(), [refreshPosts]);

  useEffect(() => {
    const fetchTrendingPets = async () => {
      try {
        const { data } = await supabase
          .from('pets')
          .select('id, name, species, breed, avatar_url')
          .limit(6)
          .order('created_at', { ascending: false });
        
        setTrendingPets((data || []) as Pet[]);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching trending pets:', error);
        }
      }
    };
    fetchTrendingPets();
  }, []);

  return (
    <>
      {/* Stories Bar */}
      <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg gradient-story">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">Pet Stories</h3>
          </div>
          <StoriesBar />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Feed - 2 columns */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Tabs value={feedType} onValueChange={handleFeedTypeChange}>
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-white shadow-sm border border-border/50 rounded-2xl p-1.5 h-12 sm:h-14">
                <TabsTrigger 
                  value="all" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:gradient-primary data-[state=active]:text-white font-bold transition-all text-xs sm:text-sm h-full"
                >
                  <Globe className="h-4 w-4" />
                  <span>Discover</span>
                  <span className="hidden sm:inline">🔥</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:gradient-accent data-[state=active]:text-white font-bold transition-all text-xs sm:text-sm h-full" 
                  disabled={!user}
                >
                  <Users className="h-4 w-4" />
                  <span>Following</span>
                  <span className="hidden sm:inline">💕</span>
                </TabsTrigger>
              </TabsList>

              <CreatePostCard onPostCreated={handleRefresh} />

              <ScrollArea className="h-[500px] sm:h-[600px]">
                <TabsContent value="all" className="mt-0 pr-2 sm:pr-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4 animate-pulse">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">Loading pawsome posts...</p>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 p-8 sm:p-12 text-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full gradient-hero flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl animate-bounce-gentle">🐾</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-foreground mb-2">No posts yet!</p>
                      <p className="text-muted-foreground text-sm mb-4">Be the first to share something pawsome</p>
                      {!user && (
                        <Link to="/auth">
                          <Button className="btn-primary rounded-xl font-bold">
                            Join the Pack
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLike={handleLike}
                          onUnlike={handleUnlike}
                          onDelete={handleRefresh}
                          onCommentCountChange={updatePostCommentCount}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="following" className="mt-0 pr-2 sm:pr-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                      <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mb-4 animate-pulse">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">Loading your feed...</p>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 p-8 sm:p-12 text-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                        <Users className="h-10 w-10 sm:h-12 sm:w-12 text-accent" />
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-foreground mb-2">
                        {user ? "Your feed is empty!" : "Join the pack!"}
                      </p>
                      <p className="text-muted-foreground text-sm mb-4">
                        {user ? "Follow some adorable pets to see their posts! 🐶" : "Login to see posts from pets you follow"}
                      </p>
                      <Link to="/explore">
                        <Button className="btn-accent rounded-xl font-bold">
                          <Search className="h-4 w-4 mr-2" />
                          Find Pets to Follow
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLike={handleLike}
                          onUnlike={handleUnlike}
                          onDelete={handleRefresh}
                          onCommentCountChange={updatePostCommentCount}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Trending Pets */}
            {trendingPets.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sunshine/10">
                      <TrendingUp className="h-4 w-4 text-sunshine" />
                    </div>
                    Trending Pets 🔥
                  </h3>
                  <div className="space-y-1">
                    {trendingPets.slice(0, 5).map((pet, index) => (
                      <Link 
                        key={pet.id} 
                        to={`/pet/${pet.id}`}
                        className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-[0.98]"
                      >
                        <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}</span>
                        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-primary/20 flex-shrink-0">
                          {pet.avatar_url ? (
                            <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" loading="lazy" decoding="async" width={44} height={44} />
                          ) : (
                            <PawPrint className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{pet.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{pet.species}{pet.breed && ` • ${pet.breed}`}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link to="/explore" className="block mt-3 sm:mt-4">
                    <Button variant="outline" className="w-full rounded-xl font-bold text-sm h-11 border-2 hover:bg-primary/5 hover:border-primary transition-all">
                      See All Pets
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-4 sm:p-5">
                <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg gradient-fun">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  Quick Actions
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <Link to="/explore" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-accent/10 hover:bg-accent/15 transition-all active:scale-[0.98]">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0 shadow-md">
                      <Search className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm">Explore Pets</p>
                      <p className="text-xs text-muted-foreground truncate">Discover new friends 🐾</p>
                    </div>
                  </Link>
                  <Link to="/messages" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-lavender/10 hover:bg-lavender/15 transition-all active:scale-[0.98]">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-fun flex items-center justify-center flex-shrink-0 shadow-md">
                      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm">Messages</p>
                      <p className="text-xs text-muted-foreground truncate">Chat with pet parents 💬</p>
                    </div>
                  </Link>
                  {user && (
                    <Link to="/pets/new" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-primary/10 hover:bg-primary/15 transition-all active:scale-[0.98]">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-md">
                        <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm">Add New Pet</p>
                        <p className="text-xs text-muted-foreground truncate">Create a profile 🐾</p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeaturedProducts />
    </>
  );
};

export default BelowFoldContent;
