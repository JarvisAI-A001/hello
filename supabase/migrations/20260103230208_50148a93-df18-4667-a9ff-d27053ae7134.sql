-- Add api_key column to store the ModelStack API key
ALTER TABLE public.bots 
ADD COLUMN api_key text UNIQUE;

-- Add bot_type column to identify the type of bot
ALTER TABLE public.bots 
ADD COLUMN bot_type text DEFAULT 'chatbot';

-- Create a function to generate unique ModelStack API key
CREATE OR REPLACE FUNCTION public.generate_modelstack_api_key(p_bot_type text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  random_part text;
  type_suffix text;
  new_key text;
  key_exists boolean;
BEGIN
  -- Map bot type to suffix
  type_suffix := CASE p_bot_type
    WHEN 'chatbot' THEN 'cb'
    WHEN 'email-replier' THEN 'er'
    WHEN 'appointment-maker' THEN 'am'
    WHEN 'content-generator' THEN 'cg'
    WHEN 'image-gen' THEN 'ig'
    WHEN 'video-gen' THEN 'vg'
    WHEN 'audio-gen' THEN 'tts'
    ELSE 'bot'
  END;
  
  -- Generate unique key
  LOOP
    -- Generate random 24 character hex string
    random_part := encode(gen_random_bytes(12), 'hex');
    new_key := 'msk_' || random_part || '_' || type_suffix;
    
    -- Check if key already exists
    SELECT EXISTS(SELECT 1 FROM public.bots WHERE api_key = new_key) INTO key_exists;
    EXIT WHEN NOT key_exists;
  END LOOP;
  
  RETURN new_key;
END;
$$;

-- Create trigger to auto-generate api_key on insert
CREATE OR REPLACE FUNCTION public.set_bot_api_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.api_key IS NULL THEN
    NEW.api_key := generate_modelstack_api_key(COALESCE(NEW.bot_type, 'chatbot'));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_bot_api_key_trigger
BEFORE INSERT ON public.bots
FOR EACH ROW
EXECUTE FUNCTION public.set_bot_api_key();

-- Update existing bots with api_keys
UPDATE public.bots 
SET api_key = generate_modelstack_api_key(COALESCE(bot_type, 'chatbot'))
WHERE api_key IS NULL;