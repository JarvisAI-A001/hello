ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_plan_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'starter', 'optimizer', 'enterprise'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
ON public.profiles (stripe_customer_id);

CREATE INDEX IF NOT EXISTS profiles_stripe_subscription_id_idx
ON public.profiles (stripe_subscription_id);
