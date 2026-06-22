-- ============================================================
-- Fix: Infinite recursion in RLS policies (Postgres error 42P17)
--
-- Root cause: All superadmin policies used:
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
--
-- When policies on OTHER tables (e.g. security_events) evaluate this subquery,
-- Postgres must read `profiles` — but `profiles` has its own RLS policies that
-- run the SAME subquery, causing infinite recursion.
--
-- Fix: Read the user role directly from the JWT claim using auth.jwt().
-- This requires NO table lookup, breaking the recursion entirely.
--
-- Run this in Supabase SQL Editor → New Query.
-- ============================================================

-- Step 1: Create a stable helper function that reads role from the JWT.
-- SECURITY DEFINER + STABLE allows Postgres to cache the result per statement.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin',
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- Step 2: Drop all existing superadmin policies and recreate them
--         using is_superadmin() instead of the recursive subquery.
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Superadmins can insert profiles" ON profiles;

CREATE POLICY "Superadmins can view all profiles" ON profiles
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all profiles" ON profiles
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (public.is_superadmin());

-- weddings
DROP POLICY IF EXISTS "Superadmins can view all weddings" ON weddings;
DROP POLICY IF EXISTS "Superadmins can update all weddings" ON weddings;
DROP POLICY IF EXISTS "Superadmins can insert weddings" ON weddings;

CREATE POLICY "Superadmins can view all weddings" ON weddings
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all weddings" ON weddings
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert weddings" ON weddings
  FOR INSERT WITH CHECK (public.is_superadmin());

-- tasks
DROP POLICY IF EXISTS "Superadmins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Superadmins can update all tasks" ON tasks;
DROP POLICY IF EXISTS "Superadmins can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Superadmins can delete all tasks" ON tasks;

CREATE POLICY "Superadmins can view all tasks" ON tasks
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all tasks" ON tasks
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert tasks" ON tasks
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can delete all tasks" ON tasks
  FOR DELETE USING (public.is_superadmin());

-- budget_categories
DROP POLICY IF EXISTS "Superadmins can view all budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Superadmins can update all budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Superadmins can insert budget categories" ON budget_categories;

CREATE POLICY "Superadmins can view all budget categories" ON budget_categories
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all budget categories" ON budget_categories
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert budget categories" ON budget_categories
  FOR INSERT WITH CHECK (public.is_superadmin());

-- expenses
DROP POLICY IF EXISTS "Superadmins can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Superadmins can update all expenses" ON expenses;
DROP POLICY IF EXISTS "Superadmins can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Superadmins can delete all expenses" ON expenses;

CREATE POLICY "Superadmins can view all expenses" ON expenses
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all expenses" ON expenses
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert expenses" ON expenses
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can delete all expenses" ON expenses
  FOR DELETE USING (public.is_superadmin());

-- vendors
DROP POLICY IF EXISTS "Superadmins can view all vendors" ON vendors;
DROP POLICY IF EXISTS "Superadmins can update all vendors" ON vendors;
DROP POLICY IF EXISTS "Superadmins can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Superadmins can delete all vendors" ON vendors;

CREATE POLICY "Superadmins can view all vendors" ON vendors
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all vendors" ON vendors
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert vendors" ON vendors
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can delete all vendors" ON vendors
  FOR DELETE USING (public.is_superadmin());

-- guests
DROP POLICY IF EXISTS "Superadmins can view all guests" ON guests;
DROP POLICY IF EXISTS "Superadmins can update all guests" ON guests;
DROP POLICY IF EXISTS "Superadmins can insert guests" ON guests;
DROP POLICY IF EXISTS "Superadmins can delete all guests" ON guests;

CREATE POLICY "Superadmins can view all guests" ON guests
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all guests" ON guests
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert guests" ON guests
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can delete all guests" ON guests
  FOR DELETE USING (public.is_superadmin());

-- appointments
DROP POLICY IF EXISTS "Superadmins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Superadmins can update all appointments" ON appointments;
DROP POLICY IF EXISTS "Superadmins can insert appointments" ON appointments;

CREATE POLICY "Superadmins can view all appointments" ON appointments
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all appointments" ON appointments
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert appointments" ON appointments
  FOR INSERT WITH CHECK (public.is_superadmin());

-- messages
DROP POLICY IF EXISTS "Superadmins can view all messages" ON messages;
DROP POLICY IF EXISTS "Superadmins can update all messages" ON messages;
DROP POLICY IF EXISTS "Superadmins can insert messages" ON messages;

CREATE POLICY "Superadmins can view all messages" ON messages
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all messages" ON messages
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert messages" ON messages
  FOR INSERT WITH CHECK (public.is_superadmin());

-- activity_log
DROP POLICY IF EXISTS "Superadmins can view all activity logs" ON activity_log;
DROP POLICY IF EXISTS "Superadmins can insert activity logs" ON activity_log;

CREATE POLICY "Superadmins can view all activity logs" ON activity_log
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert activity logs" ON activity_log
  FOR INSERT WITH CHECK (public.is_superadmin());

-- app_analytics
DROP POLICY IF EXISTS "Superadmins can view all app analytics" ON app_analytics;
DROP POLICY IF EXISTS "Superadmins can insert app analytics" ON app_analytics;

CREATE POLICY "Superadmins can view all app analytics" ON app_analytics
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert app analytics" ON app_analytics
  FOR INSERT WITH CHECK (public.is_superadmin());

-- conversion_funnel
DROP POLICY IF EXISTS "Superadmins can view all conversion funnel data" ON conversion_funnel;
DROP POLICY IF EXISTS "Superadmins can insert conversion funnel data" ON conversion_funnel;

CREATE POLICY "Superadmins can view all conversion funnel data" ON conversion_funnel
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert conversion funnel data" ON conversion_funnel
  FOR INSERT WITH CHECK (public.is_superadmin());

-- retention_metrics
DROP POLICY IF EXISTS "Superadmins can view all retention metrics" ON retention_metrics;
DROP POLICY IF EXISTS "Superadmins can insert retention metrics" ON retention_metrics;

CREATE POLICY "Superadmins can view all retention metrics" ON retention_metrics
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert retention metrics" ON retention_metrics
  FOR INSERT WITH CHECK (public.is_superadmin());

-- revenue_tracking
DROP POLICY IF EXISTS "Superadmins can view all revenue tracking" ON revenue_tracking;
DROP POLICY IF EXISTS "Superadmins can insert revenue tracking" ON revenue_tracking;
DROP POLICY IF EXISTS "Superadmins can update revenue tracking" ON revenue_tracking;

CREATE POLICY "Superadmins can view all revenue tracking" ON revenue_tracking
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert revenue tracking" ON revenue_tracking
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can update revenue tracking" ON revenue_tracking
  FOR UPDATE USING (public.is_superadmin());

-- market_insights
DROP POLICY IF EXISTS "Superadmins can view all market insights" ON market_insights;
DROP POLICY IF EXISTS "Superadmins can insert market insights" ON market_insights;

CREATE POLICY "Superadmins can view all market insights" ON market_insights
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert market insights" ON market_insights
  FOR INSERT WITH CHECK (public.is_superadmin());

-- seasonal_trends
DROP POLICY IF EXISTS "Superadmins can view all seasonal trends" ON seasonal_trends;
DROP POLICY IF EXISTS "Superadmins can insert seasonal trends" ON seasonal_trends;

CREATE POLICY "Superadmins can view all seasonal trends" ON seasonal_trends
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert seasonal trends" ON seasonal_trends
  FOR INSERT WITH CHECK (public.is_superadmin());

-- error_logs
DROP POLICY IF EXISTS "Superadmins can view all error logs" ON error_logs;
DROP POLICY IF EXISTS "Superadmins can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Superadmins can update error logs" ON error_logs;

CREATE POLICY "Superadmins can view all error logs" ON error_logs
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can update error logs" ON error_logs
  FOR UPDATE USING (public.is_superadmin());

-- performance_metrics
DROP POLICY IF EXISTS "Superadmins can view all performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Superadmins can insert performance metrics" ON performance_metrics;

CREATE POLICY "Superadmins can view all performance metrics" ON performance_metrics
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (public.is_superadmin());

-- security_events (the one that triggered the error)
DROP POLICY IF EXISTS "Superadmins can view all security events" ON security_events;
DROP POLICY IF EXISTS "Superadmins can insert security events" ON security_events;
DROP POLICY IF EXISTS "Superadmins can update security events" ON security_events;

-- Security events need special treatment: anonymous inserts must be allowed
-- for logging failed logins (no session = no JWT role claim).
-- We allow INSERT from any authenticated OR anonymous request, but restrict SELECT/UPDATE to superadmins.
CREATE POLICY "Superadmins can view all security events" ON security_events
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Anyone can insert security events" ON security_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Superadmins can update security events" ON security_events
  FOR UPDATE USING (public.is_superadmin());

-- ============================================================
-- Step 3: Update schema.sql comment to reflect the fix
-- (Apply this migration first, then update schema.sql manually
--  by replacing all superadmin policy bodies with is_superadmin())
-- ============================================================
