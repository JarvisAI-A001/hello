-- Create a table for storing generated videos
CREATE TABLE public.generated_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  prompt TEXT NOT NULL,
  style TEXT NOT NULL,
  video_concept TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  username TEXT DEFAULT 'anonymous',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing (anyone can see videos)
CREATE POLICY "Anyone can view generated videos" 
ON public.generated_videos 
FOR SELECT 
USING (true);

-- Create policy for inserting (anyone can create videos for now)
CREATE POLICY "Anyone can create videos" 
ON public.generated_videos 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.generated_videos;