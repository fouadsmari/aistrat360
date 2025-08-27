-- Migration: Rename subscription_plans to subscription_packs and update structure for pack management
-- This migration creates the pack system: free, starter, pro, advanced

-- Drop existing view first
DROP VIEW IF EXISTS user_subscription_details;

-- Rename the table from subscription_plans to subscription_packs
ALTER TABLE public.subscription_plans RENAME TO subscription_packs;

-- Update the data to match the requested pack names
UPDATE public.subscription_packs SET name = 'free' WHERE name = 'trial';

-- Remove the trial_days column as it's not needed for the pack system
ALTER TABLE public.subscription_packs DROP COLUMN IF EXISTS trial_days;

-- Add quota management columns for pack features
ALTER TABLE public.subscription_packs ADD COLUMN IF NOT EXISTS quotas JSONB DEFAULT '{}';

-- Update the pack data with proper structure
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

-- Update indexes
DROP INDEX IF EXISTS idx_subscription_plans_name;
DROP INDEX IF EXISTS idx_subscription_plans_enabled;
DROP INDEX IF EXISTS idx_subscription_plans_sort_order;

CREATE INDEX idx_subscription_packs_name ON public.subscription_packs(name);
CREATE INDEX idx_subscription_packs_enabled ON public.subscription_packs(is_enabled);
CREATE INDEX idx_subscription_packs_sort_order ON public.subscription_packs(sort_order);

-- Drop and recreate policies with new table name
DROP POLICY IF EXISTS "Anyone can view enabled plans" ON public.subscription_packs;
DROP POLICY IF EXISTS "Admins can manage all plans" ON public.subscription_packs;

CREATE POLICY "Anyone can view enabled packs" ON public.subscription_packs
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Super admins can manage all packs" ON public.subscription_packs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Update trigger name
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_packs;
CREATE TRIGGER update_subscription_packs_updated_at 
  BEFORE UPDATE ON public.subscription_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update the enum values to match our pack system (add free if not exists)
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'free';

-- Update default subscription plan to 'free' instead of current default
ALTER TABLE public.subscriptions ALTER COLUMN plan SET DEFAULT 'free';

-- Create updated view for user subscription details with packs
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  s.id as subscription_id,
  s.plan,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.trial_start,
  s.trial_end,
  s.cancel_at_period_end,
  sp.display_name_en,
  sp.display_name_fr,
  sp.description_en,
  sp.description_fr,
  sp.price_monthly,
  sp.price_yearly,
  sp.features,
  sp.quotas,
  sp.is_popular
FROM public.profiles u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
LEFT JOIN public.subscription_packs sp ON s.plan::text = sp.name;

-- Grant access to the view
GRANT SELECT ON user_subscription_details TO authenticated;