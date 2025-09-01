-- Migration: Create DataForSEO analyses table for Phase 2
-- Date: 2025-09-01
-- Description: Setup DataForSEO keyword analysis database schema

-- 1. Create DataForSEO analyses table
CREATE TABLE IF NOT EXISTS dataforseo_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES user_websites(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) DEFAULT 'keyword_analysis' CHECK (analysis_type IN ('keyword_analysis', 'competitor_analysis', 'content_analysis')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Input parameters for analysis
  input_data JSONB NOT NULL, -- {country: 'FR', language: 'fr', limit: 900}
  
  -- DataForSEO API responses (raw data)
  ranked_keywords_response JSONB, -- Response from ranked_keywords endpoint
  keyword_suggestions_response JSONB, -- Response from keyword_suggestions endpoint  
  html_content_response JSONB, -- Response from on_page instant_pages
  
  -- Processed analysis results
  analysis_results JSONB, -- {keywords: [], opportunities: [], metrics: {}}
  
  -- Metadata
  dataforseo_cost DECIMAL(10,4) DEFAULT 0, -- Cost in USD for this analysis
  total_keywords INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- 2. Create keyword results table for efficient querying
CREATE TABLE IF NOT EXISTS dataforseo_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES dataforseo_analyses(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  keyword_type VARCHAR(50) NOT NULL CHECK (keyword_type IN ('ranked', 'suggestion', 'competitor')),
  
  -- SEO metrics
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  cpc DECIMAL(10,2),
  competition DECIMAL(5,4), -- 0-1 scale
  
  -- Ranking data (for ranked keywords)
  current_position INTEGER,
  previous_position INTEGER,
  url TEXT,
  
  -- Additional metrics
  seasonal_trend JSONB, -- Monthly trend data
  related_keywords TEXT[], -- Array of related terms
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dataforseo_analyses_user_id ON dataforseo_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_dataforseo_analyses_website_id ON dataforseo_analyses(website_id);
CREATE INDEX IF NOT EXISTS idx_dataforseo_analyses_status ON dataforseo_analyses(status);
CREATE INDEX IF NOT EXISTS idx_dataforseo_analyses_created_at ON dataforseo_analyses(created_at);

CREATE INDEX IF NOT EXISTS idx_dataforseo_keywords_analysis_id ON dataforseo_keywords(analysis_id);
CREATE INDEX IF NOT EXISTS idx_dataforseo_keywords_keyword ON dataforseo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_dataforseo_keywords_type ON dataforseo_keywords(keyword_type);
CREATE INDEX IF NOT EXISTS idx_dataforseo_keywords_search_volume ON dataforseo_keywords(search_volume DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE dataforseo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataforseo_keywords ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for dataforseo_analyses
CREATE POLICY "Users can view their own DataForSEO analyses" 
ON dataforseo_analyses FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DataForSEO analyses" 
ON dataforseo_analyses FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DataForSEO analyses" 
ON dataforseo_analyses FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Admin policies for dataforseo_analyses
CREATE POLICY "Admins can view all DataForSEO analyses" 
ON dataforseo_analyses FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- 6. Create RLS policies for dataforseo_keywords
CREATE POLICY "Users can view keywords from their analyses" 
ON dataforseo_keywords FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM dataforseo_analyses 
    WHERE id = dataforseo_keywords.analysis_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert keywords for their analyses" 
ON dataforseo_keywords FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dataforseo_analyses 
    WHERE id = dataforseo_keywords.analysis_id 
    AND user_id = auth.uid()
  )
);

-- Admin policies for dataforseo_keywords
CREATE POLICY "Admins can view all DataForSEO keywords" 
ON dataforseo_keywords FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON dataforseo_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dataforseo_keywords TO authenticated;

-- 8. Create function to calculate analysis cost
CREATE OR REPLACE FUNCTION calculate_dataforseo_cost(
  ranked_keywords_count INTEGER DEFAULT 0,
  suggestions_count INTEGER DEFAULT 0
)
RETURNS DECIMAL(10,4)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- DataForSEO pricing: $0.11 per 1000 keywords for ranked_keywords
  -- $0.0115 per keyword for keyword_suggestions  
  RETURN (
    (ranked_keywords_count * 0.11 / 1000.0) + 
    (suggestions_count * 0.0115)
  );
END;
$$;

-- 9. Create function to update analysis progress
CREATE OR REPLACE FUNCTION update_analysis_progress(
  analysis_uuid UUID,
  new_progress INTEGER,
  new_status VARCHAR(20) DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE dataforseo_analyses 
  SET 
    progress = new_progress,
    status = COALESCE(new_status, status),
    started_at = CASE 
      WHEN started_at IS NULL AND new_progress > 0 THEN NOW() 
      ELSE started_at 
    END,
    completed_at = CASE 
      WHEN new_progress = 100 THEN NOW() 
      ELSE completed_at 
    END
  WHERE id = analysis_uuid;
END;
$$;

-- Migration completed successfully