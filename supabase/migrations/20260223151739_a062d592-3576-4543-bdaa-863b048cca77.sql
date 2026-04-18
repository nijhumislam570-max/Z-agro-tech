-- Enable realtime for user_roles so role changes are pushed to connected clients
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;