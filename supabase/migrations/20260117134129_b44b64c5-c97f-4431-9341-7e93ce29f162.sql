-- Create clinic_reviews table
CREATE TABLE public.clinic_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, user_id)
);

-- Enable RLS
ALTER TABLE public.clinic_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view clinic reviews"
ON public.clinic_reviews
FOR SELECT
USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.clinic_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.clinic_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.clinic_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_clinic_reviews_updated_at
BEFORE UPDATE ON public.clinic_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_clinic_reviews_clinic_id ON public.clinic_reviews(clinic_id);
CREATE INDEX idx_clinic_reviews_user_id ON public.clinic_reviews(user_id);

-- Create a function to update clinic average rating
CREATE OR REPLACE FUNCTION public.update_clinic_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clinics
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM public.clinic_reviews
    WHERE clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
  )
  WHERE id = COALESCE(NEW.clinic_id, OLD.clinic_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-update clinic rating on review changes
CREATE TRIGGER update_clinic_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.clinic_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_clinic_rating();