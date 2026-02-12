-- Table to store chat sessions from embedded widgets
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL DEFAULT 'visitor-' || substring(gen_random_uuid()::text, 1, 8),
  location TEXT DEFAULT 'Unknown',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'ended')),
  flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store individual messages in chat sessions
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'bot')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for aggregated analytics data
CREATE TABLE public.bot_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_users INTEGER NOT NULL DEFAULT 0,
  total_chats INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_id, date)
);

-- Table for location analytics
CREATE TABLE public.bot_location_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id TEXT NOT NULL,
  location TEXT NOT NULL,
  user_count INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_id, location, date)
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_location_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions - anyone can insert (from widget), bot owners can read
CREATE POLICY "Anyone can create chat sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (true);

-- Policies for chat_messages
CREATE POLICY "Anyone can create chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (true);

-- Policies for bot_analytics
CREATE POLICY "Anyone can view bot analytics" 
ON public.bot_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert bot analytics" 
ON public.bot_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update bot analytics" 
ON public.bot_analytics 
FOR UPDATE 
USING (true);

-- Policies for bot_location_analytics
CREATE POLICY "Anyone can view bot location analytics" 
ON public.bot_location_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert bot location analytics" 
ON public.bot_location_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update bot location analytics" 
ON public.bot_location_analytics 
FOR UPDATE 
USING (true);

-- Enable realtime for live chat viewing
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create indexes for performance
CREATE INDEX idx_chat_sessions_bot_id ON public.chat_sessions(bot_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_bot_analytics_bot_id_date ON public.bot_analytics(bot_id, date);
CREATE INDEX idx_bot_location_analytics_bot_id ON public.bot_location_analytics(bot_id);

-- Trigger to update updated_at
CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_bots_updated_at();