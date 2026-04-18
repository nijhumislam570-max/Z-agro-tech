import { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicReviews } from '@/hooks/useClinicReviews';
import WriteReviewDialog from './WriteReviewDialog';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
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

interface ClinicReviewsSectionProps {
  clinicId: string;
  clinicName: string;
}

const ClinicReviewsSection = ({ clinicId, clinicName }: ClinicReviewsSectionProps) => {
  const { user } = useAuth();
  const { reviews, isLoading, refetch, userReview, ratingStats, deleteReview, isDeleting } = useClinicReviews(clinicId);
  const [showWriteDialog, setShowWriteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<typeof userReview>(null);

  const handleWriteReview = () => {
    if (!user) {
      toast.error('Please sign in to write a review');
      return;
    }
    setEditingReview(null);
    setShowWriteDialog(true);
  };

  const handleEditReview = () => {
    setEditingReview(userReview);
    setShowWriteDialog(true);
  };

  const handleDeleteReview = () => {
    if (userReview) {
      deleteReview(userReview.id, {
        onSuccess: () => {
          toast.success('Review deleted successfully');
          setShowDeleteDialog(false);
        },
        onError: () => {
          toast.error('Failed to delete review');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-border/50">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-border/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-display font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Customer Reviews
        </h2>
        {userReview ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEditReview} className="flex-1 sm:flex-none">
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={handleWriteReview} className="w-full sm:w-auto">
            Write a Review
          </Button>
        )}
      </div>
      
      {/* Rating Summary */}
      <div className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-100/50 mb-6">
        <div className="text-center sm:border-r sm:border-amber-200/50 sm:pr-6">
          <div className="text-4xl sm:text-5xl font-bold text-foreground">
            {ratingStats.average || '—'}
          </div>
          <div className="flex items-center justify-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star 
                key={i} 
                className={`h-5 w-5 ${
                  i <= Math.floor(ratingStats.average) 
                    ? 'text-amber-500 fill-amber-500' 
                    : 'text-muted/30'
                }`} 
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {ratingStats.total} {ratingStats.total === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <div className="flex-1 space-y-2">
          {ratingStats.distribution.map(({ stars, percentage, count }) => (
            <div key={stars} className="flex items-center gap-2 sm:gap-3">
              <span className="text-sm w-3 text-muted-foreground">{stars}</span>
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <Progress value={percentage} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground mb-4">No reviews yet</p>
          <Button variant="outline" onClick={handleWriteReview}>
            Be the first to review
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div 
              key={review.id} 
              className={`p-4 sm:p-5 rounded-xl border ${
                review.user_id === user?.id 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/20 border-border/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {(review.profile?.full_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        {review.profile?.full_name || 'Anonymous User'}
                      </p>
                      {review.user_id === user?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star 
                      key={i} 
                      className={`h-3.5 w-3.5 ${
                        i <= review.rating 
                          ? 'text-amber-500 fill-amber-500' 
                          : 'text-muted/30'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-muted-foreground text-sm mb-3">{review.comment}</p>
              )}
              <button 
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => toast.info('Thanks for your feedback!')}
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Write Review Dialog */}
      <WriteReviewDialog
        open={showWriteDialog}
        onOpenChange={setShowWriteDialog}
        clinicId={clinicId}
        clinicName={clinicName}
        existingReview={editingReview}
        onSuccess={refetch}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClinicReviewsSection;
