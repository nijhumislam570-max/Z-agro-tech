import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { reviewSchema, type ReviewFormData } from '@/lib/validations';

interface ProductReviewFormProps {
  productId: string;
  /** Optional callback for parents that want to refresh local state. */
  onReviewSubmitted?: () => void;
}

const ProductReviewForm = ({ productId, onReviewSubmitted }: ProductReviewFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
    mode: 'onChange',
  });

  const rating = form.watch('rating');

  const submitMutation = useMutation({
    mutationFn: async (values: ReviewFormData) => {
      if (!user) throw new Error('Please sign in to review');
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating: values.rating,
        comment: values.comment?.trim() || null,
      });
      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate')) {
          throw new Error('You have already reviewed this product');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Review submitted!');
      form.reset({ rating: 0, comment: '' });
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-ratings'] });
      onReviewSubmitted?.();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      toast.error(msg);
    },
  });

  if (!user) {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">Please log in to write a review.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => submitMutation.mutate(v))}
        className="bg-background rounded-xl border border-border p-4 sm:p-5 space-y-4"
      >
        <h3 className="font-semibold text-foreground">Write a Review</h3>

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <label className="text-sm text-muted-foreground">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => field.onChange(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star className={`h-7 w-7 transition-colors ${
                      star <= (hoveredRating || field.value)
                        ? 'text-warning fill-warning'
                        : 'text-muted-foreground/30'
                    }`} />
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <label className="text-sm text-muted-foreground">Your Review (optional)</label>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Share your experience with this product..."
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={submitMutation.isPending || rating === 0}
          className="w-full sm:w-auto gap-2"
        >
          {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Submit Review
        </Button>
      </form>
    </Form>
  );
};

export default ProductReviewForm;
