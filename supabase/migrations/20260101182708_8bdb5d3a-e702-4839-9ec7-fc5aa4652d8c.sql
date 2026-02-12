-- Create a table to store bot configurations for embedding
CREATE TABLE public.bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id TEXT NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  name TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  typing_speed TEXT NOT NULL DEFAULT 'medium',
  behavior_rules TEXT[] DEFAULT '{}',
  business_name TEXT,
  industry TEXT,
  services TEXT,
  contact_info TEXT,
  payment_methods TEXT,
  locations TEXT,
  faqs TEXT,
  policies TEXT,
  tags TEXT[] DEFAULT '{}',
  greeting_message TEXT DEFAULT 'Hi! How can I help you today?',
  primary_color TEXT DEFAULT '#0EA5E9',
  avatar_url TEXT,
  allowed_domains TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast bot_id lookups
CREATE INDEX idx_bots_bot_id ON public.bots(bot_id);

-- Enable Row Level Security
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active bots (needed for embedding)
CREATE POLICY "Public can read active bots" 
ON public.bots 
FOR SELECT 
USING (is_active = true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bots_updated_at
BEFORE UPDATE ON public.bots
FOR EACH ROW
EXECUTE FUNCTION public.update_bots_updated_at();