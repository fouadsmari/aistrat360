-- Fix pack constraints and complete the migration

-- Drop the constraint that limits pack names
ALTER TABLE public.subscription_packs DROP CONSTRAINT IF EXISTS subscription_plans_name_check;

-- Add new constraint with updated pack names
ALTER TABLE public.subscription_packs ADD CONSTRAINT subscription_packs_name_check 
  CHECK (name IN ('free', 'starter', 'pro', 'advanced'));

-- Now update the pack names safely
UPDATE public.subscription_packs SET name = 'free' WHERE name = 'trial';

-- Update the pack data with proper structure for free pack
UPDATE public.subscription_packs SET 
  display_name_en = 'Free',
  display_name_fr = 'Gratuit',
  description_en = 'Free access to basic features',
  description_fr = 'Accès gratuit aux fonctionnalités de base',
  price_monthly = 0,
  price_yearly = 0,
  features = '[
    {"en": "Basic features access", "fr": "Accès aux fonctionnalités de base"},
    {"en": "Limited projects", "fr": "Projets limités"},
    {"en": "Community support", "fr": "Support communautaire"}
  ]',
  quotas = '{
    "projects": 1,
    "storage_gb": 1,
    "api_calls_per_month": 1000,
    "team_members": 1
  }'
WHERE name = 'free';

-- Update other packs with quotas
UPDATE public.subscription_packs SET 
  quotas = '{
    "projects": 5,
    "storage_gb": 10,
    "api_calls_per_month": 10000,
    "team_members": 3
  }'
WHERE name = 'starter';

UPDATE public.subscription_packs SET 
  quotas = '{
    "projects": 25,
    "storage_gb": 100,
    "api_calls_per_month": 100000,
    "team_members": 10
  }'
WHERE name = 'pro';

UPDATE public.subscription_packs SET 
  quotas = '{
    "projects": -1,
    "storage_gb": 1000,
    "api_calls_per_month": -1,
    "team_members": -1
  }'
WHERE name = 'advanced';

-- Update existing subscriptions to use 'free' instead of 'trial'
UPDATE public.subscriptions SET plan = 'free' WHERE plan = 'trial';