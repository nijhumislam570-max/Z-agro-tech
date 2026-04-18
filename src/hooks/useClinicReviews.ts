import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClinicReview {
  id: string;
  clinic_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useClinicReviews = (clinicId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all reviews for a clinic
  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['clinic-reviews', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_reviews')
        .select('id, clinic_id, user_id, rating, comment, helpful_count, created_at, updated_at')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each reviewer
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(review => ({
        ...review,
        profile: profileMap.get(review.user_id) || null,
      })) as ClinicReview[];
    },
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000, // 5 minutes - reviews don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch user's own review
  const { data: userReview } = useQuery({
    queryKey: ['clinic-user-review', clinicId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('clinic_reviews')
        .select('id, clinic_id, user_id, rating, comment, helpful_count, created_at')
        .eq('clinic_id', clinicId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!clinicId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate rating stats
  const ratingStats = {
    average: reviews.length > 0 
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0,
    total: reviews.length,
    distribution: [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: reviews.filter(r => r.rating === stars).length,
      percentage: reviews.length > 0 
        ? Math.round((reviews.filter(r => r.rating === stars).length / reviews.length) * 100)
        : 0,
    })),
  };

  // Mark review as helpful
  const markHelpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      // Get current count first, then increment
      const { data: review } = await supabase
        .from('clinic_reviews')
        .select('helpful_count')
        .eq('id', reviewId)
        .single();
      
      const { error } = await supabase
        .from('clinic_reviews')
        .update({ helpful_count: (review?.helpful_count || 0) + 1 })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-reviews', clinicId] });
    },
  });

  // Delete review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('clinic_reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-reviews', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['clinic-user-review', clinicId] });
    },
  });

  return {
    reviews,
    isLoading,
    refetch,
    userReview,
    ratingStats,
    markHelpful: markHelpfulMutation.mutate,
    deleteReview: deleteReviewMutation.mutate,
    isDeleting: deleteReviewMutation.isPending,
  };
};
