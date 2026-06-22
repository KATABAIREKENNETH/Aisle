-- Add RLS policies for performance_metrics table
-- These policies allow superadmins to insert and view performance metrics

CREATE POLICY "Superadmins can view all performance metrics" ON performance_metrics
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );
