-- Enable Row Level Security (RLS) on the album_entries table
-- This satisfies the Supabase security scanner warning.
ALTER TABLE public.album_entries ENABLE ROW LEVEL SECURITY;

-- Note: Since the PhotoDay Next.js application uses custom JWT authentication
-- and exclusively accesses the database via `supabaseAdmin` (Service Role Key) 
-- in the /api/* routes, the Server bypasses RLS automatically.
-- No complex policies using auth.uid() are needed!
