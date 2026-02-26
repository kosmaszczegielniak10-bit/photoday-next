-- Enable Row Level Security (RLS) on the album_entries table
ALTER TABLE public.album_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view album_entries their friends have access to
-- Assuming album entries belong to an album which is associated with a user
CREATE POLICY "Users can view album entries" 
ON public.album_entries
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE a.id = album_entries.album_id
        -- Add any further logic here if albums are restricted by privacy/friendship
    )
);

-- Allow users to insert entries into their own albums
CREATE POLICY "Users can insert album entries" 
ON public.album_entries
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE a.id = album_entries.album_id AND a.user_id = auth.uid()
    )
);

-- Allow users to update their own entries
CREATE POLICY "Users can update their own entries" 
ON public.album_entries
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE a.id = album_entries.album_id AND a.user_id = auth.uid()
    )
);

-- Allow users to delete their own entries
CREATE POLICY "Users can delete their own entries" 
ON public.album_entries
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.albums a
        WHERE a.id = album_entries.album_id AND a.user_id = auth.uid()
    )
);
