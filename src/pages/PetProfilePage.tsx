import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PetProfileCard } from '@/components/social/PetProfileCard';
import { PostCard } from '@/components/social/PostCard';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Grid3X3, ImageIcon, Film, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { Pet, Post } from '@/types/social';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Memoized photo grid item
const PhotoGridItem = memo(({ url, postId, index, onClick }: { url: string; postId: string; index: number; onClick: () => void }) => (
  <div 
    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
    aria-label={`View photo ${index + 1}`}
  >
    <img 
      src={url} 
      alt={`Pet photo ${index + 1}`}
      loading="lazy"
      className="w-full h-full object-cover transition-transform transform-gpu group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" aria-hidden="true" />
  </div>
));

PhotoGridItem.displayName = 'PhotoGridItem';

// Memoized video grid item
const VideoGridItem = memo(({ url, postId, onClick }: { url: string; postId: string; onClick: () => void }) => (
  <div 
    className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-muted"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
    aria-label="Play video"
  >
    <video 
      src={url} 
      className="w-full h-full object-cover"
      preload="metadata"
    />
    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg" aria-hidden="true">
        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-foreground border-b-[8px] border-b-transparent ml-1" />
      </div>
    </div>
  </div>
));

VideoGridItem.displayName = 'VideoGridItem';

const PetProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  
  useDocumentTitle(pet?.name ? `${pet.name}'s Profile` : 'Pet Profile');
  
  const { 
    posts, 
    loading: postsLoading, 
    likePost, 
    unlikePost, 
    refreshPosts,
    updatePostCommentCount
  } = usePosts(id, 'pet');

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setPet(data as Pet);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching pet:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  const handlePetUpdate = useCallback((updatedPet: Pet) => {
    setPet(updatedPet);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const handleLikePost = useCallback((postId: string) => {
    likePost(postId);
  }, [likePost]);

  const handleUnlikePost = useCallback((postId: string) => {
    unlikePost(postId);
  }, [unlikePost]);

  const handleRefreshPosts = useCallback(() => {
    refreshPosts();
  }, [refreshPosts]);

  const handlePostClick = useCallback((postId: string) => {
    navigate(`/post/${postId}`);
  }, [navigate]);

  const handleGoToFeed = useCallback(() => {
    navigate('/feed');
  }, [navigate]);

  // Filter posts by media type
  const imagePosts = posts.filter(post => post.media_type === 'image' && post.media_urls?.length > 0);
  const videoPosts = posts.filter(post => post.media_type === 'video' && post.media_urls?.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20" aria-busy="true" aria-label="Loading pet profile">
          <Loader2 className="h-8 w-8 animate-spin text-primary transform-gpu" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" className="container mx-auto px-4 py-20 text-center" role="main">
          <div className="text-6xl mb-4" aria-hidden="true">🐾</div>
          <h1 className="text-2xl font-bold mb-2">Pet Not Found</h1>
          <p className="text-muted-foreground mb-4">This pet profile doesn't exist or has been removed.</p>
          <Button onClick={handleGoToFeed}>
            Go to Feed
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = user?.id === pet.user_id;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-0 sm:px-4 py-0 sm:py-6 max-w-3xl" role="main" aria-label={`${pet.name}'s profile`}>
        {/* Profile Card */}
        <PetProfileCard 
          pet={pet} 
          postsCount={posts.length} 
          isOwner={isOwner}
          onPetUpdate={handlePetUpdate}
        />

        {/* Create Post (only for owner) */}
        {isOwner && (
          <div className="mt-3 sm:mt-4 px-2 sm:px-0">
            <CreatePostCard onPostCreated={handleRefreshPosts} defaultPetId={pet.id} />
          </div>
        )}

        {/* Content Tabs - Facebook Style */}
        <div className="mt-3 sm:mt-4 px-2 sm:px-0">
          <div className="bg-card rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full h-12 sm:h-14 bg-transparent rounded-none border-b border-border/50 p-0 grid grid-cols-3" aria-label="Content tabs">
                <TabsTrigger 
                  value="posts" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-semibold text-sm sm:text-base transition-all"
                  aria-label="View all posts"
                >
                  <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="photos" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-semibold text-sm sm:text-base transition-all"
                  aria-label="View photos"
                >
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                  Photos
                </TabsTrigger>
                <TabsTrigger 
                  value="videos" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-semibold text-sm sm:text-base transition-all"
                  aria-label="View videos"
                >
                  <Film className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                  Videos
                </TabsTrigger>
              </TabsList>

              {/* Posts Tab */}
              <TabsContent value="posts" className="mt-0 p-3 sm:p-4">
                {postsLoading ? (
                  <div className="flex justify-center py-12" aria-busy="true">
                    <Loader2 className="h-8 w-8 animate-spin text-primary transform-gpu" aria-hidden="true" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12" role="status">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
                      <Grid3X3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No posts yet</h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? "Share your first moment!" : "When this pet shares, posts will appear here."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4" role="feed" aria-label="Pet's posts">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLikePost}
                        onUnlike={handleUnlikePost}
                        onDelete={handleRefreshPosts}
                        onCommentCountChange={updatePostCommentCount}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="mt-0 p-3 sm:p-4">
                {postsLoading ? (
                  <div className="flex justify-center py-12" aria-busy="true">
                    <Loader2 className="h-8 w-8 animate-spin text-primary transform-gpu" aria-hidden="true" />
                  </div>
                ) : imagePosts.length === 0 ? (
                  <div className="text-center py-12" role="status">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No photos</h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? "Share cute photos of this pet!" : "No photos shared yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 sm:gap-2" role="list" aria-label="Photo gallery">
                    {imagePosts.map((post) => (
                      post.media_urls?.map((url, index) => (
                        <PhotoGridItem
                          key={`${post.id}-${index}`}
                          url={url}
                          postId={post.id}
                          index={index}
                          onClick={() => handlePostClick(post.id)}
                        />
                      ))
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="videos" className="mt-0 p-3 sm:p-4">
                {postsLoading ? (
                  <div className="flex justify-center py-12" aria-busy="true">
                    <Loader2 className="h-8 w-8 animate-spin text-primary transform-gpu" aria-hidden="true" />
                  </div>
                ) : videoPosts.length === 0 ? (
                  <div className="text-center py-12" role="status">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No videos</h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? "Share fun videos (max 1 min)!" : "No videos shared yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3" role="list" aria-label="Video gallery">
                    {videoPosts.map((post) => (
                      <VideoGridItem
                        key={post.id}
                        url={post.media_urls?.[0] || ''}
                        postId={post.id}
                        onClick={() => handlePostClick(post.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PetProfilePage;
