import { useState } from 'react';
import { Star, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface WriteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
  onSuccess: () => void;
}

const WriteReviewDialog = ({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  existingReview,
  onSuccess,
}: WriteReviewDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to write a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('clinic_reviews')
          .update({
            rating,
            comment: comment.trim() || null,
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        const { error } = await supabase
          .from('clinic_reviews')
          .insert({
            clinic_id: clinicId,
            user_id: user.id,
            rating,
            comment: comment.trim() || null,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('You have already reviewed this clinic');
            return;
          }
          throw error;
        }
        toast.success('Review submitted successfully!');
      }

      onSuccess();
      onOpenChange(false);
      setRating(0);
      setComment('');
    } catch (error) {
      logger.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {existingReview ? 'Edit Your Review' : 'Write a Review'}
          </DialogTitle>
          <DialogDescription>
            Share your experience at {clinicName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Your Rating *</Label>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 sm:h-10 sm:w-10 transition-colors',
                        (hoverRating || rating) >= star
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>
              {(hoverRating || rating) > 0 && (
                <p className="text-sm font-medium text-primary animate-in fade-in">
                  {ratingLabels[hoverRating || rating]}
                </p>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-medium">
              Your Review (Optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Tell others about your experience..."
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 characters
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : existingReview ? (
              'Update Review'
            ) : (
              'Submit Review'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WriteReviewDialog;
