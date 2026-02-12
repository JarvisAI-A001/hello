-- Add booking fields to bots table
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS booking_enabled boolean DEFAULT false;
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS booking_button_text text DEFAULT 'Schedule an appointment';
