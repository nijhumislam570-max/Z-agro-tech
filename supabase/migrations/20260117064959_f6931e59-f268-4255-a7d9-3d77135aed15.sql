-- Create a function to check pet count limit
CREATE OR REPLACE FUNCTION public.check_pet_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.pets WHERE user_id = NEW.user_id) >= 30 THEN
    RAISE EXCEPTION 'Maximum limit of 30 pets reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce the limit
CREATE TRIGGER enforce_pet_limit
  BEFORE INSERT ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pet_limit();