-- Compatibility alias for clients that still query `public.profile` (singular).
-- This keeps old requests working while the app uses `public.profiles` (plural).
DROP VIEW IF EXISTS public.profile;

CREATE VIEW public.profile
WITH (security_invoker = true)
AS
SELECT *
FROM public.profiles;

