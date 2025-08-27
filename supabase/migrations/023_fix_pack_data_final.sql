-- Final fix for pack data and constraints

-- First check what data we have
SELECT name FROM public.subscription_packs;

-- Remove the problematic constraint temporarily
ALTER TABLE public.subscription_packs DROP CONSTRAINT IF EXISTS subscription_packs_name_check;
ALTER TABLE public.subscription_packs DROP CONSTRAINT IF EXISTS subscription_plans_name_check;

-- Update any remaining inconsistent data
UPDATE public.subscription_packs SET name = 'free' WHERE name = 'trial';
UPDATE public.subscription_packs SET name = 'starter' WHERE name = 'starter';
UPDATE public.subscription_packs SET name = 'pro' WHERE name = 'pro';
UPDATE public.subscription_packs SET name = 'advanced' WHERE name = 'advanced';

-- Delete any rows that don't match our expected pack names
DELETE FROM public.subscription_packs WHERE name NOT IN ('free', 'starter', 'pro', 'advanced');

-- Now add the constraint with correct names
ALTER TABLE public.subscription_packs ADD CONSTRAINT subscription_packs_name_check 
  CHECK (name IN ('free', 'starter', 'pro', 'advanced'));

-- Ensure we have all the required packs with correct data
INSERT INTO public.subscription_packs (
  name, display_name_en, display_name_fr, description_en, description_fr,
  price_monthly, price_yearly, features, quotas, is_enabled, sort_order
) VALUES
(
  'free',
  'Free',
  'Gratuit',
  'Free access to basic features',
  'Accès gratuit aux fonctionnalités de base',
  0,
  0,
  '[
    {"en": "Basic features access", "fr": "Accès aux fonctionnalités de base"},
    {"en": "1 project", "fr": "1 projet"},
    {"en": "Community support", "fr": "Support communautaire"}
  ]',
  '{
    "projects": 1,
    "storage_gb": 1,
    "api_calls_per_month": 1000,
    "team_members": 1
  }',
  true,
  0
)
ON CONFLICT (name) DO UPDATE SET
  display_name_en = EXCLUDED.display_name_en,
  display_name_fr = EXCLUDED.display_name_fr,
  description_en = EXCLUDED.description_en,
  description_fr = EXCLUDED.description_fr,
  quotas = EXCLUDED.quotas;

-- Update existing subscriptions
UPDATE public.subscriptions SET plan = 'free' WHERE plan = 'trial';