-- Add owner_messages table for takeover and whisper messages
CREATE TABLE public.owner_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.chat_sessions(id) NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'takeover',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on owner_messages
ALTER TABLE public.owner_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for owner_messages
CREATE POLICY "Anyone can insert owner messages" 
ON public.owner_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view owner messages" 
ON public.owner_messages 
FOR SELECT 
USING (true);