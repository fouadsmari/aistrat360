-- Create business type enum
CREATE TYPE business_type AS ENUM ('ecommerce', 'service', 'vitrine');

-- Create user_websites table
CREATE TABLE IF NOT EXISTS public.user_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT,
  business_type business_type NOT NULL,
  target_countries TEXT[] NOT NULL DEFAULT '{}',
  site_languages TEXT[] NOT NULL DEFAULT '{}',
  industry TEXT,
  monthly_ads_budget DECIMAL(10,2),
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_url CHECK (url ~* '^https?://[^\s/$.?#].[^\s]*$'),
  CONSTRAINT valid_countries CHECK (array_length(target_countries, 1) > 0),
  CONSTRAINT valid_languages CHECK (array_length(site_languages, 1) > 0),
  CONSTRAINT valid_budget CHECK (monthly_ads_budget IS NULL OR monthly_ads_budget >= 0),
  
  -- Unique constraint on user_id + url to prevent duplicates
  UNIQUE(user_id, url)
);

-- Create function to enforce website quotas based on subscription plans
CREATE OR REPLACE FUNCTION check_website_quota()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get user's current subscription plan
  SELECT COALESCE(s.plan, 'free')::TEXT INTO user_plan
  FROM public.subscriptions s
  WHERE s.user_id = NEW.user_id;
  
  -- Set quota limits based on plan
  CASE user_plan
    WHEN 'free', 'trial', 'starter' THEN max_allowed := 1;
    WHEN 'pro' THEN max_allowed := 3;
    WHEN 'advanced' THEN max_allowed := 5;
    ELSE max_allowed := 1; -- Default fallback
  END CASE;
  
  -- Count current websites for user
  SELECT COUNT(*) INTO current_count
  FROM public.user_websites
  WHERE user_id = NEW.user_id;
  
  -- Check if adding this website would exceed quota
  IF (TG_OP = 'INSERT' AND current_count >= max_allowed) THEN
    RAISE EXCEPTION 'Website quota exceeded. Plan % allows maximum % websites, you currently have %', 
      user_plan, max_allowed, current_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for website quota enforcement
CREATE TRIGGER enforce_website_quota
  BEFORE INSERT ON public.user_websites
  FOR EACH ROW EXECUTE FUNCTION check_website_quota();

-- Create function to ensure only one primary website per user
CREATE OR REPLACE FUNCTION ensure_single_primary_website()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this website as primary, unset all other primary websites for this user
  IF NEW.is_primary = TRUE THEN
    UPDATE public.user_websites 
    SET is_primary = FALSE, updated_at = NOW()
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary website enforcement
CREATE TRIGGER enforce_single_primary_website
  BEFORE INSERT OR UPDATE OF is_primary ON public.user_websites
  FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_website();

-- Create trigger for updated_at
CREATE TRIGGER update_user_websites_updated_at 
  BEFORE UPDATE ON public.user_websites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_websites_user_id ON public.user_websites(user_id);
CREATE INDEX idx_user_websites_is_primary ON public.user_websites(user_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_user_websites_business_type ON public.user_websites(business_type);
CREATE INDEX idx_user_websites_is_verified ON public.user_websites(is_verified);
CREATE INDEX idx_user_websites_created_at ON public.user_websites(created_at);

-- Enable Row Level Security
ALTER TABLE public.user_websites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own websites" ON public.user_websites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own websites" ON public.user_websites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own websites" ON public.user_websites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites" ON public.user_websites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all websites" ON public.user_websites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage all websites" ON public.user_websites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Create view for website quota information
CREATE OR REPLACE VIEW user_website_quotas AS
SELECT 
  p.id as user_id,
  p.email,
  COALESCE(s.plan, 'free')::TEXT as plan,
  COUNT(uw.id) as websites_used,
  CASE COALESCE(s.plan, 'free')::TEXT
    WHEN 'free' THEN 1
    WHEN 'trial' THEN 1
    WHEN 'starter' THEN 1
    WHEN 'pro' THEN 3
    WHEN 'advanced' THEN 5
    ELSE 1
  END as websites_limit,
  (COUNT(uw.id) >= CASE COALESCE(s.plan, 'free')::TEXT
    WHEN 'free' THEN 1
    WHEN 'trial' THEN 1
    WHEN 'starter' THEN 1
    WHEN 'pro' THEN 3
    WHEN 'advanced' THEN 5
    ELSE 1
  END) as quota_reached
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
LEFT JOIN public.user_websites uw ON p.id = uw.user_id
GROUP BY p.id, p.email, s.plan;

-- Grant access to the view
GRANT SELECT ON user_website_quotas TO authenticated;