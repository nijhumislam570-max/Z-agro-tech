-- Enable realtime for orders table so users see status changes immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;