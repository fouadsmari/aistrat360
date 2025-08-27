-- Fix subscription_plan enum to match pack names and ensure consistency

-- First, let's check current enum values and update them
-- We need to handle this carefully as changing enum values requires special handling in PostgreSQL

-- Add the new enum values if they don't exist
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'pro';

-- Update any 'professional' values to 'pro' in the subscriptions table
UPDATE public.subscriptions SET plan = 'pro' WHERE plan = 'professional';

-- Update any 'enterprise' values to 'advanced' in the subscriptions table  
UPDATE public.subscriptions SET plan = 'advanced' WHERE plan = 'enterprise';

-- Since PostgreSQL doesn't allow direct removal of enum values without recreating the enum,
-- we'll create a new enum and migrate to it

-- Create new enum with correct values
CREATE TYPE subscription_plan_new AS ENUM ('free', 'starter', 'pro', 'advanced');

-- Update the subscriptions table to use the new enum
ALTER TABLE public.subscriptions 
  ALTER COLUMN plan TYPE subscription_plan_new 
  USING plan::text::subscription_plan_new;

-- Update the default value
ALTER TABLE public.subscriptions ALTER COLUMN plan SET DEFAULT 'free';

-- Drop the old enum and rename the new one
DROP TYPE subscription_plan;
ALTER TYPE subscription_plan_new RENAME TO subscription_plan;

-- Verify data integrity - ensure all subscriptions have valid plans
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for any invalid plan values
    SELECT COUNT(*) INTO invalid_count
    FROM public.subscriptions
    WHERE plan NOT IN ('free', 'starter', 'pro', 'advanced');
    
    IF invalid_count > 0 THEN
        -- Set invalid plans to 'free' as default
        UPDATE public.subscriptions 
        SET plan = 'free' 
        WHERE plan NOT IN ('free', 'starter', 'pro', 'advanced');
        
        RAISE NOTICE 'Fixed % invalid subscription plans by setting them to free', invalid_count;
    END IF;
END $$;

-- Log the result
SELECT 'Subscription plan enum updated successfully. Valid plans: free, starter, pro, advanced' as result;