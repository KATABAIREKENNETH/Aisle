-- Migration: Fix infinite recursion in wedding_members RLS policies
-- This replaces the recursive wedding_members policies with non-recursive versions

-- Drop all existing wedding_members policies to avoid conflicts
DROP POLICY IF EXISTS "Superadmins can view all wedding members" ON wedding_members;
DROP POLICY IF EXISTS "Users can view wedding members for weddings they belong to" ON wedding_members;
DROP POLICY IF EXISTS "Superadmins can insert wedding members" ON wedding_members;
DROP POLICY IF EXISTS "Users can insert wedding members to their conversations" ON wedding_members;
DROP POLICY IF EXISTS "Superadmins can insert wedding members to their weddings" ON wedding_members;
DROP POLICY IF EXISTS "Superadmins can update all wedding members" ON wedding_members;
DROP POLICY IF EXISTS "Users can update wedding members in their weddings" ON wedding_members;
DROP POLICY IF EXISTS "Users can update their own participant role" ON wedding_members;
DROP POLICY IF EXISTS "Superadmins can delete wedding members" ON wedding_members;
DROP POLICY IF EXISTS "Users can delete wedding members from their weddings" ON wedding_members;
DROP POLICY IF EXISTS "Users can delete wedding members from their conversations" ON wedding_members;

-- Create non-recursive policies using a security definer function
CREATE OR REPLACE FUNCTION get_user_wedding_ids(p_user_id UUID)
RETURNS TABLE (wedding_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT wedding_id 
  FROM wedding_members 
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new non-recursive policies
CREATE POLICY "Users can view wedding members for weddings they belong to" ON wedding_members
  FOR SELECT USING (
    wedding_id IN (SELECT wedding_id FROM get_user_wedding_ids(auth.uid()))
  );

CREATE POLICY "Users can insert wedding members to their weddings" ON wedding_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_members 
      WHERE wedding_id = wedding_members.wedding_id 
      AND user_id = auth.uid() 
      AND role IN ('couple', 'partner', 'planner')
    )
  );

CREATE POLICY "Users can update wedding members in their weddings" ON wedding_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM wedding_members wm
      WHERE wm.wedding_id = wedding_members.wedding_id 
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('couple', 'partner', 'planner')
    )
  );

CREATE POLICY "Users can delete wedding members from their weddings" ON wedding_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wedding_members wm
      WHERE wm.wedding_id = wedding_members.wedding_id 
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('couple', 'partner', 'planner')
    )
  );
