-- Simple fix for subscription plan consistency
-- Since the enum already has the values we need, just clean up the data

-- Add missing enum values if needed (these will be skipped if they already exist)
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'pro';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'advanced';

-- Update any inconsistent data in subscriptions table
UPDATE public.subscriptions SET plan = 'pro' WHERE plan = 'professional';
UPDATE public.subscriptions SET plan = 'advanced' WHERE plan = 'enterprise';
UPDATE public.subscriptions SET plan = 'free' WHERE plan = 'trial';

-- Set default to 'free' for new subscriptions
ALTER TABLE public.subscriptions ALTER COLUMN plan SET DEFAULT 'free';

-- Ensure all users have a subscription with a valid plan
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT p.id, 'free', 'active'
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id
);

-- Update any NULL or invalid subscription statuses
UPDATE public.subscriptions 
SET status = 'active' 
WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'canceled', 'expired', 'trial');

-- Log the result
SELECT 
    'Migration completed. Plans fixed:' as message,
    COUNT(*) as total_subscriptions,
    COUNT(*) FILTER (WHERE plan = 'free') as free_plans,
    COUNT(*) FILTER (WHERE plan = 'starter') as starter_plans,
    COUNT(*) FILTER (WHERE plan = 'pro') as pro_plans,
    COUNT(*) FILTER (WHERE plan = 'advanced') as advanced_plans
FROM public.subscriptions;