ALTER TABLE public.bots
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini',
ADD COLUMN IF NOT EXISTS widget_style TEXT DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS icon_style TEXT DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS background_style TEXT DEFAULT 'clean',
ADD COLUMN IF NOT EXISTS suggested_questions TEXT[] DEFAULT '{}';
