-- Enable realtime for users table
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;