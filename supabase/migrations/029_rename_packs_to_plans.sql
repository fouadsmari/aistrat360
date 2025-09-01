-- Rename subscription_packs table and references back to subscription_plans
-- This reverts the earlier rename from plans to packs

-- 1. Rename the table
ALTER TABLE subscription_packs RENAME TO subscription_plans;

-- 2. Update foreign key references in subscriptions table
ALTER TABLE subscriptions 
  DROP CONSTRAINT IF EXISTS subscriptions_plan_fkey,
  ADD CONSTRAINT subscriptions_plan_fkey 
    FOREIGN KEY (plan) REFERENCES subscription_plans(name) ON UPDATE CASCADE ON DELETE RESTRICT;

-- 3. Update indexes (they should automatically be renamed with the table)

-- 4. Update RLS policies 
DROP POLICY IF EXISTS "Admins can view all subscription packs" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can insert subscription packs" ON subscription_plans;  
DROP POLICY IF EXISTS "Admins can update subscription packs" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can delete subscription packs" ON subscription_plans;

CREATE POLICY "Admins can view all subscription plans" ON subscription_plans 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert subscription plans" ON subscription_plans 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update subscription plans" ON subscription_plans 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete subscription plans" ON subscription_plans 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );