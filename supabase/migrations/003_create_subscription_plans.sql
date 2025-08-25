-- Create subscription plans table for storing plan details and features
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('starter', 'pro', 'advanced', 'trial')),
  display_name_en TEXT NOT NULL,
  display_name_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  is_enabled BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert initial subscription plans data
INSERT INTO public.subscription_plans (
  name, display_name_en, display_name_fr, description_en, description_fr,
  price_monthly, price_yearly, features, is_enabled, is_popular, sort_order, trial_days
) VALUES
(
  'trial',
  'Trial',
  'Essai',
  'Try our platform for free',
  'Essayez notre plateforme gratuitement',
  0,
  0,
  '[
    {"en": "Access to basic features", "fr": "Accès aux fonctionnalités de base"},
    {"en": "1 project", "fr": "1 projet"},
    {"en": "Email support", "fr": "Support par email"},
    {"en": "14-day trial", "fr": "14 jours d''essai"}
  ]',
  true,
  false,
  0,
  14
),
(
  'starter',
  'Starter',
  'Starter',
  'Perfect for individuals and small teams',
  'Parfait pour les particuliers et petites équipes',
  9.99,
  99.99,
  '[
    {"en": "All basic features", "fr": "Toutes les fonctionnalités de base"},
    {"en": "5 projects", "fr": "5 projets"},
    {"en": "10GB storage", "fr": "10GB de stockage"},
    {"en": "Email support", "fr": "Support par email"},
    {"en": "Mobile app access", "fr": "Accès à l''application mobile"}
  ]',
  true,
  false,
  1,
  0
),
(
  'pro',
  'Pro',
  'Pro',
  'Best for growing businesses and teams',
  'Idéal pour les entreprises en croissance et les équipes',
  29.99,
  299.99,
  '[
    {"en": "All Starter features", "fr": "Toutes les fonctionnalités Starter"},
    {"en": "25 projects", "fr": "25 projets"},
    {"en": "100GB storage", "fr": "100GB de stockage"},
    {"en": "Priority support", "fr": "Support prioritaire"},
    {"en": "Advanced analytics", "fr": "Analyses avancées"},
    {"en": "Team collaboration", "fr": "Collaboration d''équipe"},
    {"en": "API access", "fr": "Accès API"}
  ]',
  true,
  true,
  2,
  0
),
(
  'advanced',
  'Advanced',
  'Avancé',
  'For large organizations with complex needs',
  'Pour les grandes organisations aux besoins complexes',
  99.99,
  999.99,
  '[
    {"en": "All Pro features", "fr": "Toutes les fonctionnalités Pro"},
    {"en": "Unlimited projects", "fr": "Projets illimités"},
    {"en": "1TB storage", "fr": "1TB de stockage"},
    {"en": "24/7 phone support", "fr": "Support téléphonique 24/7"},
    {"en": "Custom integrations", "fr": "Intégrations personnalisées"},
    {"en": "White-label options", "fr": "Options de marque blanche"},
    {"en": "SLA guarantee", "fr": "Garantie SLA"},
    {"en": "Dedicated account manager", "fr": "Gestionnaire de compte dédié"}
  ]',
  true,
  false,
  3,
  0
);

-- Create indexes for performance
CREATE INDEX idx_subscription_plans_name ON public.subscription_plans(name);
CREATE INDEX idx_subscription_plans_enabled ON public.subscription_plans(is_enabled);
CREATE INDEX idx_subscription_plans_sort_order ON public.subscription_plans(sort_order);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (readable by everyone, manageable by admins only)
CREATE POLICY "Anyone can view enabled plans" ON public.subscription_plans
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage all plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing subscription enum to include new plans
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'pro';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'advanced';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'trial';

-- Update subscriptions table to use the new plan names
-- Note: This would need to be done carefully in production with proper data migration
-- For now, we'll just ensure the enum supports our new plan names

-- Create a view for easy subscription plan lookups with user data
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
  sp.is_popular
FROM public.profiles u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
LEFT JOIN public.subscription_plans sp ON s.plan::text = sp.name;

-- Grant access to the view
GRANT SELECT ON user_subscription_details TO authenticated;

-- Note: Views don't support RLS policies directly
-- Security is handled through the underlying tables (profiles, subscriptions)
-- which already have appropriate RLS policies in place