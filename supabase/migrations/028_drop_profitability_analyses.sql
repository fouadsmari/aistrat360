-- Drop profitability_analyses table and related components
-- This table was used by the removed /tools/analyse functionality

-- Drop indexes first
DROP INDEX IF EXISTS idx_profitability_analyses_user_id;
DROP INDEX IF EXISTS idx_profitability_analyses_status;
DROP INDEX IF EXISTS idx_profitability_analyses_created_at;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view their own analyses" ON profitability_analyses;
DROP POLICY IF EXISTS "Users can create their own analyses" ON profitability_analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON profitability_analyses;

-- Drop the table
DROP TABLE IF EXISTS profitability_analyses;