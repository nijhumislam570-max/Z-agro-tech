import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { PostCard } from '@/components/social/PostCard';
import { StoriesBar } from '@/components/social/StoriesBar';
import { FeedSkeletons, PostCardSkeleton } from '@/components/social/PostCardSkeleton';
import { usePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Compass, Loader2 } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import SEO from '@/components/SEO';

const FeedPage = () => {
  useDocumentTitle('Social Feed');
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');

  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    likePost,
    unlikePost,
    loadMore,
    refreshPosts,
    updatePostCommentCount
  } = usePosts(undefined, feedType);

  // Infinite scroll sentinel
  const { sentinelRef } = useInfiniteScroll(loadMore, {
    isLoading: loading || loadingMore,
    hasMore,
    threshold: 300,
  });


  const handleFeedTypeChange = useCallback((value: string) => {
    setFeedType(value as 'all' | 'following');
  }, []);

  const renderPosts = () => {
    if (loading) {
      return <FeedSkeletons />;
    }

    if (posts.length === 0) {
      return (
        <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6 sm:p-8 text-center" role="status">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center" aria-hidden="true">
            {feedType === 'following' ? (
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            ) : (
              <span className="text-2xl sm:text-3xl">📝</span>
            )}
          </div>
          <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
            {feedType === 'following'
              ? user ? "No posts from followed pets" : "Login required"
              : "No posts yet"}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {feedType === 'following'
              ? user ? "Follow some pets to see their posts here!" : "Login to see posts from pets you follow"
              : "Be the first to share something!"}
          </p>
        </div>
      );
    }

    return (
      <>
        <div role="feed" aria-label="Posts" aria-busy={loadingMore} className="space-y-3 sm:space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              style={{ contentVisibility: 'auto', containIntrinsicSize: '0 520px' }}
            >
              <PostCard
                post={post}
                onLike={likePost}
                onUnlike={unlikePost}
                onDelete={refreshPosts}
                onCommentCountChange={updatePostCommentCount}
              />
            </div>
          ))}
        </div>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="py-4 sm:py-6 space-y-3 sm:space-y-4">
            <PostCardSkeleton />
          </div>
        )}

        {/* Sentinel element for infinite scroll */}
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />

        {/* End of feed message */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6 sm:py-8">
            <p className="text-muted-foreground text-xs sm:text-sm">You've reached the end 🐾</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col pb-20 md:pb-0">
      <SEO 
        title="Social Feed - Pet Community"
        description="Connect with pet parents, share adorable moments, and discover trending pet content on VetMedix social feed."
        url="https://vetmedix.lovable.app/feed"
        noIndex
      />
      <Navbar />

      <main id="main-content" className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 max-w-[680px] flex-1" role="main" aria-label="Pet Social Feed">
        {/* Stories */}
        <StoriesBar />

        <Tabs value={feedType} onValueChange={handleFeedTypeChange}>
          <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 p-1 bg-card border border-border/50 rounded-xl shadow-sm h-11 sm:h-12" aria-label="Feed type selection">
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 rounded-lg font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-all"
              aria-label="Discover all posts"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xs:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex items-center gap-2 rounded-lg font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-all"
              disabled={!user}
              aria-label="View posts from pets you follow"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xs:inline">Following</span>
            </TabsTrigger>
          </TabsList>

          <CreatePostCard onPostCreated={refreshPosts} />

          <TabsContent value="all" className="mt-0">
            {renderPosts()}
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {renderPosts()}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default FeedPage;
