
-- Create clinic_favorites table
CREATE TABLE public.clinic_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

ALTER TABLE public.clinic_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clinic favorites" ON public.clinic_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add clinic favorites" ON public.clinic_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove clinic favorites" ON public.clinic_favorites FOR DELETE USING (auth.uid() = user_id);

-- Create doctor_favorites table
CREATE TABLE public.doctor_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, doctor_id)
);

ALTER TABLE public.doctor_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own doctor favorites" ON public.doctor_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add doctor favorites" ON public.doctor_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove doctor favorites" ON public.doctor_favorites FOR DELETE USING (auth.uid() = user_id);
