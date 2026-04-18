import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Heart,
  Users,
  Image,
  Trash2,
  Eye,
  Search,
  Loader2,
  Filter,
  Calendar,
  PawPrint,
  ArrowLeft,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdmin } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { useDeletePost, useDeletePet, useDeleteComment } from '@/hooks/useAdminSocialActions';
import { format } from 'date-fns';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface Post {
  id: string;
  content: string | null;
  media_urls: string[] | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  pet_id: string;
  pet?: { id: string; name: string; avatar_url: string | null; species: string };
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatar_url: string | null;
  created_at: string;
  user_id: string;
  posts_count?: number;
}

interface PetParent {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  pets_count: number;
  pets: { id: string; name: string; species: string }[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  pet_id: string | null;
  pet?: { id: string; name: string; avatar_url: string | null } | null;
  post?: { id: string; content: string | null; pet?: { name: string } };
}

type ActiveView = 'overview' | 'posts' | 'posts_today' | 'pets' | 'parents' | 'likes' | 'comments';

const AdminSocial = () => {
  useDocumentTitle('Social Moderation - Admin');
  const { isAdmin } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);

  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [petToDelete, setPetToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [deletePetConfirmOpen, setDeletePetConfirmOpen] = useState(false);
  const [deleteCommentConfirmOpen, setDeleteCommentConfirmOpen] = useState(false);

  const deletePost = useDeletePost();
  const deletePet = useDeletePet();
  const deleteComment = useDeleteComment();

  // Fetch social stats
  const { data: socialStats } = useQuery({
    queryKey: ['admin-social-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [
        { count: totalPosts },
        { count: totalPets },
        { count: totalLikes },
        { count: totalComments },
        { count: postsToday },
        { data: petParentsData },
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('pets').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('pets').select('user_id'),
      ]);
      return {
        totalPosts: totalPosts || 0,
        totalPets: totalPets || 0,
        totalLikes: totalLikes || 0,
        totalComments: totalComments || 0,
        postsToday: postsToday || 0,
        petParents: new Set(petParentsData?.map(p => p.user_id) || []).size,
      };
    },
    enabled: isAdmin,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, pet:pets(id, name, avatar_url, species)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Post[];
    },
    enabled: isAdmin,
  });

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ['admin-pets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pets').select('id, name, species, breed, avatar_url, created_at, user_id').order('created_at', { ascending: false });
      if (error) throw error;
      const { data: postCounts } = await supabase.from('posts').select('pet_id');
      const countMap = new Map<string, number>();
      postCounts?.forEach(p => { countMap.set(p.pet_id, (countMap.get(p.pet_id) || 0) + 1); });
      return (data as Pet[]).map(pet => ({ ...pet, posts_count: countMap.get(pet.id) || 0 }));
    },
    enabled: isAdmin && (activeView === 'pets' || activeView === 'overview'),
  });

  const { data: petParents, isLoading: parentsLoading } = useQuery({
    queryKey: ['admin-pet-parents'],
    queryFn: async () => {
      const { data: petsData, error } = await supabase.from('pets').select('user_id, id, name, species');
      if (error) throw error;
      const userPetsMap = new Map<string, { id: string; name: string; species: string }[]>();
      petsData?.forEach(pet => {
        const existing = userPetsMap.get(pet.user_id) || [];
        existing.push({ id: pet.id, name: pet.name, species: pet.species });
        userPetsMap.set(pet.user_id, existing);
      });
      const userIds = Array.from(userPetsMap.keys());
      const { data: profiles } = await supabase.from('profiles_public').select('user_id, full_name, avatar_url').in('user_id', userIds);
      const parents: PetParent[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const userPets = userPetsMap.get(userId) || [];
        return { user_id: userId, full_name: profile?.full_name || 'Unknown User', avatar_url: profile?.avatar_url || null, pets_count: userPets.length, pets: userPets };
      });
      return parents.sort((a, b) => b.pets_count - a.pets_count);
    },
    enabled: isAdmin && (activeView === 'parents' || activeView === 'overview'),
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('comments').select('*, pet:pets(id, name, avatar_url), post:posts(id, content, pet:pets(name))').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data as Comment[];
    },
    enabled: isAdmin && (activeView === 'comments' || activeView === 'overview'),
  });

  const today = new Date().toISOString().split('T')[0];
  const todayPosts = posts?.filter(p => p.created_at.startsWith(today)) || [];
  const topLikedPosts = [...(posts || [])].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 50);

  const getFilteredPosts = () => {
    let source = posts || [];
    if (activeView === 'posts_today') source = todayPosts;
    if (activeView === 'likes') source = topLikedPosts;
    return source.filter((post) => {
      const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase()) || post.pet?.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterType === 'with_media') return matchesSearch && post.media_urls && post.media_urls.length > 0;
      if (filterType === 'text_only') return matchesSearch && (!post.media_urls || post.media_urls.length === 0);
      return matchesSearch;
    });
  };

  const filteredPosts = getFilteredPosts();
  const filteredPets = pets?.filter(pet => pet.name.toLowerCase().includes(searchQuery.toLowerCase()) || pet.species.toLowerCase().includes(searchQuery.toLowerCase()) || pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  const filteredParents = petParents?.filter(parent => parent.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || parent.pets.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))) || [];
  const filteredComments = comments?.filter(comment => comment.content.toLowerCase().includes(searchQuery.toLowerCase()) || comment.pet?.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  const renderViewTitle = () => {
    switch (activeView) {
      case 'posts': return 'All Posts';
      case 'posts_today': return "Today's Posts";
      case 'pets': return 'Pet Profiles';
      case 'parents': return 'Pet Parents';
      case 'likes': return 'Top Liked Posts';
      case 'comments': return 'All Comments';
      default: return null;
    }
  };

  return (
    <AdminLayout title="Social Media Management" subtitle="Monitor and manage pet social media content">
      {/* Stats Cards - using shared AdminStatCard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <AdminStatCard icon={MessageSquare} value={socialStats?.totalPosts || 0} label="Total Posts"
          iconColor="text-primary" iconBg="bg-primary/10"
          bgClass="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10 dark:from-primary/10 dark:to-accent/10 dark:border-primary/20"
          onClick={() => setActiveView(activeView === 'posts' ? 'overview' : 'posts')} active={activeView === 'posts'} />
        <AdminStatCard icon={Calendar} value={socialStats?.postsToday || 0} label="Posts Today"
          iconColor="text-emerald-600 dark:text-emerald-400" iconBg="bg-emerald-500/10"
          bgClass="bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50"
          onClick={() => setActiveView(activeView === 'posts_today' ? 'overview' : 'posts_today')} active={activeView === 'posts_today'} />
        <AdminStatCard icon={PawPrint} value={socialStats?.totalPets || 0} label="Pet Profiles"
          iconColor="text-blue-600 dark:text-blue-400" iconBg="bg-blue-500/10"
          bgClass="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-900/50"
          onClick={() => setActiveView(activeView === 'pets' ? 'overview' : 'pets')} active={activeView === 'pets'} />
        <AdminStatCard icon={Users} value={socialStats?.petParents || 0} label="Pet Parents"
          iconColor="text-purple-600 dark:text-purple-400" iconBg="bg-purple-500/10"
          bgClass="bg-gradient-to-br from-purple-50 to-violet-50/50 border-purple-100 dark:from-purple-950/30 dark:to-violet-950/20 dark:border-purple-900/50"
          onClick={() => setActiveView(activeView === 'parents' ? 'overview' : 'parents')} active={activeView === 'parents'} />
        <AdminStatCard icon={Heart} value={socialStats?.totalLikes || 0} label="Total Likes"
          iconColor="text-red-600 dark:text-red-400" iconBg="bg-red-500/10"
          bgClass="bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-900/50"
          onClick={() => setActiveView(activeView === 'likes' ? 'overview' : 'likes')} active={activeView === 'likes'} />
        <AdminStatCard icon={MessageSquare} value={socialStats?.totalComments || 0} label="Comments"
          iconColor="text-amber-600 dark:text-amber-400" iconBg="bg-amber-500/10"
          bgClass="bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50"
          onClick={() => setActiveView(activeView === 'comments' ? 'overview' : 'comments')} active={activeView === 'comments'} />
      </div>

      {activeView !== 'overview' && (
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setActiveView('overview')}>
            <ArrowLeft className="h-4 w-4 mr-1" />Back
          </Button>
          <h2 className="text-lg font-semibold">{renderViewTitle()}</h2>
        </div>
      )}

      {activeView !== 'overview' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeView === 'pets' ? 'Search pets...' : activeView === 'parents' ? 'Search pet parents...' : activeView === 'comments' ? 'Search comments...' : 'Search posts...'}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"
            />
          </div>
          {(activeView === 'posts' || activeView === 'posts_today' || activeView === 'likes') && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="with_media">With Media</SelectItem>
                <SelectItem value="text_only">Text Only</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {activeView === 'overview' && (
        <div className="space-y-6">
          <p className="text-muted-foreground text-center py-8">Click on any stat card above to view and manage that section</p>
        </div>
      )}

      {/* Posts View */}
      {(activeView === 'posts' || activeView === 'posts_today' || activeView === 'likes') && (
        <>
          {postsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {filteredPosts.map((post, index) => (
                <Card key={post.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {activeView === 'likes' && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 font-bold text-sm shrink-0">#{index + 1}</div>
                        )}
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={post.pet?.avatar_url || ''} />
                          <AvatarFallback>{post.pet?.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm sm:text-base">{post.pet?.name || 'Unknown Pet'}</span>
                            <Badge variant="outline" className="text-xs">{post.pet?.species || 'Pet'}</Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">{format(new Date(post.created_at), 'PPp')}</p>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-2">{post.content || <span className="text-muted-foreground italic">No text content</span>}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.likes_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{post.comments_count || 0}</span>
                          {post.media_urls && post.media_urls.length > 0 && (
                            <span className="flex items-center gap-1"><Image className="h-4 w-4" />{post.media_urls.length}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8" onClick={() => { setSelectedPost(post); setViewOpen(true); }}>
                            <Eye className="h-3 w-3 sm:mr-1" /><span className="hidden sm:inline">View</span>
                          </Button>
                          <Button variant="destructive" size="sm" className="h-8" onClick={() => { setPostToDelete(post.id); setDeleteConfirmOpen(true); }}>
                            <Trash2 className="h-3 w-3 sm:mr-1" /><span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground">{searchQuery ? 'Try adjusting your search' : 'No posts available'}</p>
            </CardContent></Card>
          )}
        </>
      )}

      {/* Pet Profiles View */}
      {activeView === 'pets' && (
        <>
          {petsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredPets.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPets.map((pet) => (
                <Card key={pet.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={pet.avatar_url || ''} />
                        <AvatarFallback><PawPrint className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{pet.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{pet.species}</Badge>
                          {pet.breed && <span className="text-xs text-muted-foreground truncate">{pet.breed}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{pet.posts_count} posts</span>
                          <span>{format(new Date(pet.created_at), 'PP')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button variant="destructive" size="sm" onClick={() => { setPetToDelete(pet.id); setDeletePetConfirmOpen(true); }}>
                        <Trash2 className="h-3 w-3 mr-1" />Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center">
              <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No pet profiles found</h3>
              <p className="text-muted-foreground">{searchQuery ? 'Try adjusting your search' : 'No pets registered yet'}</p>
            </CardContent></Card>
          )}
        </>
      )}

      {/* Pet Parents View */}
      {activeView === 'parents' && (
        <>
          {parentsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredParents.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredParents.map((parent) => (
                <Card key={parent.user_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={parent.avatar_url || ''} />
                        <AvatarFallback><Users className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{parent.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{parent.pets_count} pet{parent.pets_count !== 1 ? 's' : ''}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {parent.pets.slice(0, 3).map(pet => (<Badge key={pet.id} variant="outline" className="text-xs">{pet.name}</Badge>))}
                          {parent.pets.length > 3 && (<Badge variant="outline" className="text-xs">+{parent.pets.length - 3} more</Badge>)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No pet parents found</h3>
              <p className="text-muted-foreground">{searchQuery ? 'Try adjusting your search' : 'No users with pets yet'}</p>
            </CardContent></Card>
          )}
        </>
      )}

      {/* Comments View */}
      {activeView === 'comments' && (
        <>
          {commentsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredComments.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {filteredComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.pet?.avatar_url || ''} />
                        <AvatarFallback>{comment.pet?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{comment.pet?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">on post by {comment.post?.pet?.name || 'Unknown'}</span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(comment.created_at), 'PPp')}</p>
                      </div>
                      <Button variant="destructive" size="sm" className="shrink-0" onClick={() => { setCommentToDelete(comment.id); setDeleteCommentConfirmOpen(true); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No comments found</h3>
              <p className="text-muted-foreground">{searchQuery ? 'Try adjusting your search' : 'No comments yet'}</p>
            </CardContent></Card>
          )}
        </>
      )}

      {/* View Post Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>Posted by {selectedPost?.pet?.name} on {selectedPost && format(new Date(selectedPost.created_at), 'PPp')}</DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedPost.pet?.avatar_url || ''} />
                  <AvatarFallback>{selectedPost.pet?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedPost.pet?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPost.pet?.species}</p>
                </div>
              </div>
              {selectedPost.content && <p className="text-foreground">{selectedPost.content}</p>}
              {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.media_urls.map((url, i) => (
                    <img key={i} src={url} alt={`Media ${i + 1}`} className="rounded-lg w-full h-48 object-cover" loading="lazy" decoding="async" />
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{selectedPost.likes_count || 0} likes</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{selectedPost.comments_count || 0} comments</span>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={() => { setPostToDelete(selectedPost.id); setViewOpen(false); setDeleteConfirmOpen(true); }}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete Post
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this post? This action cannot be undone. All likes and comments associated with this post will also be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (postToDelete) { deletePost.mutate(postToDelete); setDeleteConfirmOpen(false); setPostToDelete(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletePost.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Pet Confirmation */}
      <AlertDialog open={deletePetConfirmOpen} onOpenChange={setDeletePetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pet Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pet profile? This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All posts by this pet</li>
                <li>All likes and comments</li>
                <li>All stories and follows</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (petToDelete) { deletePet.mutate(petToDelete); setDeletePetConfirmOpen(false); setPetToDelete(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletePet.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}Delete Pet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Confirmation */}
      <AlertDialog open={deleteCommentConfirmOpen} onOpenChange={setDeleteCommentConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this comment? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (commentToDelete) { deleteComment.mutate(commentToDelete); setDeleteCommentConfirmOpen(false); setCommentToDelete(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteComment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSocial;
