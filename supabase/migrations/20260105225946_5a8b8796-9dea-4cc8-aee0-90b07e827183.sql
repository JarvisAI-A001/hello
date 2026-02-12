-- Update the generate_modelstack_api_key function to use extensions schema
CREATE OR REPLACE FUNCTION public.generate_modelstack_api_key(p_bot_type text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
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
    WHEN 'social-media-marketing' THEN 'smm'
    ELSE 'bot'
  END;
  
  -- Generate unique key
  LOOP
    -- Generate random 24 character hex string using extensions.gen_random_bytes
    random_part := encode(extensions.gen_random_bytes(12), 'hex');
    new_key := 'msk_' || random_part || '_' || type_suffix;
    
    -- Check if key already exists
    SELECT EXISTS(SELECT 1 FROM public.bots WHERE api_key = new_key) INTO key_exists;
    EXIT WHEN NOT key_exists;
  END LOOP;
  
  RETURN new_key;
END;
$function$;