-- Enhanced Appointments Table with CRM & Automation Features
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS client_source text DEFAULT 'widget';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurring_schedule text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS attended boolean;

-- Create reminder_logs table
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('email', 'sms')),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on reminder_logs
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reminder logs" 
ON public.reminder_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create reminder logs" 
ON public.reminder_logs 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for reminder_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminder_logs;

-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  preferred_date date,
  preferred_service text,
  position integer,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on waitlist
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create waitlist entries" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist" 
ON public.waitlist 
FOR SELECT 
USING (true);

-- Enable realtime for waitlist
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;
