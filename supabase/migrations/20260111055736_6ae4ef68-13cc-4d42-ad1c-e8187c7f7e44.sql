-- Create stories table (48-hour expiry)
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story views table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_user_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Everyone can view active stories" ON public.stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Users can create stories for their pets" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Story owners can view who watched" ON public.story_views FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid()) OR auth.uid() = viewer_user_id);
CREATE POLICY "Users can mark stories as viewed" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_user_id);

-- Function to update story views count
CREATE OR REPLACE FUNCTION public.increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_story_view AFTER INSERT ON public.story_views FOR EACH ROW EXECUTE FUNCTION public.increment_story_views();

-- Add location to pets for discovery
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS location TEXT;

-- Create indexes
CREATE INDEX idx_pets_species ON public.pets(species);
CREATE INDEX idx_stories_expires ON public.stories(expires_at);