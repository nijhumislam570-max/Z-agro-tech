import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, PawPrint, Heart, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDeletePost } from '@/hooks/useAdminSocialActions';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const CMSSocialTab = () => {
  const deletePost = useDeletePost();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cms-social-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [
        { count: totalPosts },
        { count: commentsToday },
        { count: totalPets },
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('pets').select('*', { count: 'exact', head: true }),
      ]);
      return {
        totalPosts: totalPosts || 0,
        commentsToday: commentsToday || 0,
        totalPets: totalPets || 0,
      };
    },
    staleTime: 30000,
  });

  const { data: recentPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['cms-recent-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, likes_count, comments_count, created_at, pet:pets(id, name, avatar_url, species)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Total Posts" value={stats?.totalPosts || 0} icon={<MessageSquare className="h-5 w-5 text-primary" />} iconClassName="bg-primary/10" href="/admin/social" />
            <StatCard title="Active Discussions" value={stats?.commentsToday || 0} description="Comments today" icon={<Heart className="h-5 w-5 text-rose-500" />} iconClassName="bg-rose-500/10" href="/admin/social" />
            <StatCard title="Pet Profiles" value={stats?.totalPets || 0} icon={<PawPrint className="h-5 w-5 text-blue-500" />} iconClassName="bg-blue-500/10" />
          </>
        )}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base">Recent Posts</CardTitle>
            <Link to="/admin/social">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" /> View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {postsLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
          ) : !recentPosts?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No posts yet</p>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={post.pet?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{post.pet?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{post.pet?.name || 'Unknown'}</span>
                    <Badge variant="outline" className="text-[10px]">{post.pet?.species || 'Pet'}</Badge>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(post.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.content || 'Media post'}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes_count || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{post.comments_count || 0}</span>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the post and all its comments and likes.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePost.mutate(post.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CMSSocialTab;
