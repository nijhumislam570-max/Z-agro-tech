import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { reviewSchema } from '@/lib/validations';

interface ProductReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

const ProductReviewForm = ({ productId, onReviewSubmitted }: ProductReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">Please log in to write a review.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    const validation = reviewSchema.safeParse({ rating, comment: comment.trim() || undefined });
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Please check your review');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          toast.error('You have already reviewed this product');
        } else {
          throw error;
        }
        return;
      }
      toast.success('Review submitted!');
      setRating(0);
      setComment('');
      onReviewSubmitted();
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background rounded-xl border border-border p-4 sm:p-5 space-y-4">
      <h3 className="font-semibold text-foreground">Write a Review</h3>
      
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Your Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star className={`h-7 w-7 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-muted-foreground/30'
              }`} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Your Review (optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="min-h-[80px] resize-none"
          maxLength={500}
        />
      </div>

      <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full sm:w-auto">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Submit Review
      </Button>
    </div>
  );
};

export default ProductReviewForm;
