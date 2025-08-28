-- Migration: Create profitability analyses and API cache tables
-- Date: 2025-08-28
-- Description: Setup Google Ads Profitability Predictor database schema

-- 1. Create profitability analyses table
CREATE TABLE IF NOT EXISTS profitability_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) DEFAULT 'profitability_prediction',
  input_data JSONB NOT NULL, -- {websiteUrl: '', budget: 1000, objective: 'leads', keywords: []}
  result_data JSONB, -- {roi_predictions: [], recommended_keywords: [], avoid_keywords: []}
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  credits_used INTEGER DEFAULT 2 CHECK (credits_used > 0)
);

-- 2. Create API cache table for DataForSEO and AI responses
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL, -- hash(input + service + endpoint)
  service_type VARCHAR(50) NOT NULL, -- 'dataforseo', 'openai', 'claude'
  endpoint_type VARCHAR(50) NOT NULL, -- 'search_volume', 'website_analysis', 'roi_prediction'
  input_data JSONB NOT NULL, -- parameters used for API call
  api_response JSONB NOT NULL, -- full API response
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'), -- 3 months TTL
  hit_count INTEGER DEFAULT 0 CHECK (hit_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add analyses quota to subscription packs
ALTER TABLE subscription_packs 
ADD COLUMN IF NOT EXISTS analyses_per_month INTEGER DEFAULT 3 CHECK (analyses_per_month >= 0);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profitability_analyses_user_id ON profitability_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_profitability_analyses_status ON profitability_analyses(status);
CREATE INDEX IF NOT EXISTS idx_profitability_analyses_created_at ON profitability_analyses(created_at);

CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_service ON api_cache(service_type, endpoint_type);

-- 5. Create function for automatic cache cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM api_cache WHERE expires_at < NOW();
END;
$$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE profitability_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for profitability_analyses
CREATE POLICY "Users can view their own analyses" 
ON profitability_analyses FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" 
ON profitability_analyses FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" 
ON profitability_analyses FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" 
ON profitability_analyses FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 8. Create RLS policies for api_cache (shared cache - read-only for users)
CREATE POLICY "All authenticated users can read cache" 
ON api_cache FOR SELECT 
TO authenticated 
USING (true);

-- Only service role can write to cache (for API operations)
CREATE POLICY "Only service role can write cache" 
ON api_cache FOR ALL 
TO service_role 
USING (true);

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON profitability_analyses TO authenticated;
GRANT SELECT ON api_cache TO authenticated;
GRANT ALL ON api_cache TO service_role;

-- 10. Update existing subscription packs with default analysis quota
UPDATE subscription_packs 
SET analyses_per_month = CASE 
  WHEN name = 'free' THEN 3
  WHEN name = 'starter' THEN 20
  WHEN name = 'pro' THEN 100
  WHEN name = 'advanced' THEN -1  -- unlimited
  ELSE 3  -- default fallback
END
WHERE analyses_per_month IS NULL;

-- Migration completed successfully