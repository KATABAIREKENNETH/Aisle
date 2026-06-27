-- Fix: Disable RLS for performance_metrics inserts
-- Performance metrics need to be recorded even before authentication completes
-- (e.g., during app initialization, screen load times)
-- This is safe as performance metrics are non-sensitive data

-- Disable RLS entirely for performance_metrics table
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;
