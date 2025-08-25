-- Fix recursive policies on subscriptions table that cause trigger failure
-- The issue: policies check profiles table which causes infinite recursion during user creation

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

-- Create simple non-recursive policies
-- Users can view/manage their own subscription
CREATE POLICY "users_own_subscription" ON public.subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
-- This policy already exists: service_role_subscriptions_bypass

-- Note: Admin access to subscriptions will be handled through the service role
-- or through direct database operations, not through recursive RLS policies