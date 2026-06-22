-- Migration: Add wedding_members table for multi-role support
-- This enables users to have different roles in different weddings

-- Drop table if it exists (for re-running migration)
DROP TABLE IF EXISTS wedding_members CASCADE;

-- Create wedding_members junction table
CREATE TABLE wedding_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('couple', 'partner', 'planner', 'vendor', 'guest')),
  permissions JSONB DEFAULT '{
    "can_edit_budget": false,
    "can_manage_guests": false,
    "can_view_tasks": true,
    "can_assign_tasks": false,
    "can_send_messages": true,
    "can_edit_wedding_details": false,
    "can_manage_vendors": false,
    "can_view_budget": true
  }'::jsonb,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wedding_id, user_id)
);

-- Create indexes for wedding_members
CREATE INDEX idx_wedding_members_wedding_id ON wedding_members(wedding_id);
CREATE INDEX idx_wedding_members_user_id ON wedding_members(user_id);
CREATE INDEX idx_wedding_members_role ON wedding_members(role);

-- Enable RLS on wedding_members
ALTER TABLE wedding_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wedding_members
CREATE POLICY "Superadmins can view all wedding members" ON wedding_members
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Users can view wedding members for weddings they belong to" ON wedding_members
  FOR SELECT USING (
    wedding_members.wedding_id IN (
      SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert wedding members" ON wedding_members
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Users can insert wedding members to their own weddings" ON wedding_members
  FOR INSERT WITH CHECK (
    wedding_members.wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() AND role IN ('couple', 'partner', 'planner')
    )
  );

CREATE POLICY "Superadmins can update all wedding members" ON wedding_members
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Users can update wedding members in their weddings" ON wedding_members
  FOR UPDATE USING (
    wedding_members.wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() AND role IN ('couple', 'partner', 'planner')
    )
  );

CREATE POLICY "Superadmins can delete wedding members" ON wedding_members
  FOR DELETE USING (public.is_superadmin());

CREATE POLICY "Users can delete wedding members from their weddings" ON wedding_members
  FOR DELETE USING (
    wedding_members.wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() AND role IN ('couple', 'partner', 'planner')
    )
  );

-- Create trigger for updated_at on wedding_members
CREATE TRIGGER update_wedding_members_updated_at BEFORE UPDATE ON wedding_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing weddings to wedding_members
-- This creates wedding_members entries for existing couple_id and partner_id relationships
INSERT INTO wedding_members (wedding_id, user_id, role, permissions, joined_at)
SELECT 
  w.id as wedding_id,
  w.couple_id as user_id,
  'couple' as role,
  '{
    "can_edit_budget": true,
    "can_manage_guests": true,
    "can_view_tasks": true,
    "can_assign_tasks": true,
    "can_send_messages": true,
    "can_edit_wedding_details": true,
    "can_manage_vendors": true,
    "can_view_budget": true
  }'::jsonb as permissions,
  w.created_at as joined_at
FROM weddings w
WHERE w.couple_id IS NOT NULL
ON CONFLICT (wedding_id, user_id) DO NOTHING;

INSERT INTO wedding_members (wedding_id, user_id, role, permissions, joined_at)
SELECT 
  w.id as wedding_id,
  w.partner_id as user_id,
  'partner' as role,
  '{
    "can_edit_budget": true,
    "can_manage_guests": true,
    "can_view_tasks": true,
    "can_assign_tasks": true,
    "can_send_messages": true,
    "can_edit_wedding_details": true,
    "can_manage_vendors": true,
    "can_view_budget": true
  }'::jsonb as permissions,
  w.created_at as joined_at
FROM weddings w
WHERE w.partner_id IS NOT NULL
ON CONFLICT (wedding_id, user_id) DO NOTHING;

-- Migrate existing guests with user_id to wedding_members
-- Only run if the user_id column exists in guests table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'user_id'
  ) THEN
    INSERT INTO wedding_members (wedding_id, user_id, role, permissions, joined_at)
    SELECT DISTINCT
      g.wedding_id as wedding_id,
      g.user_id as user_id,
      'guest' as role,
      '{
        "can_edit_budget": false,
        "can_manage_guests": false,
        "can_view_tasks": false,
        "can_assign_tasks": false,
        "can_send_messages": true,
        "can_edit_wedding_details": false,
        "can_manage_vendors": false,
        "can_view_budget": false
      }'::jsonb as permissions,
      g.created_at as joined_at
    FROM guests g
    WHERE g.user_id IS NOT NULL
    ON CONFLICT (wedding_id, user_id) DO NOTHING;
  END IF;
END $$;

-- Migrate existing vendors with user_id to wedding_members
-- Only run if the user_id column exists in vendors table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'user_id'
  ) THEN
    INSERT INTO wedding_members (wedding_id, user_id, role, permissions, joined_at)
    SELECT DISTINCT
      v.wedding_id as wedding_id,
      v.user_id as user_id,
      'vendor' as role,
      '{
        "can_edit_budget": false,
        "can_manage_guests": false,
        "can_view_tasks": true,
        "can_assign_tasks": false,
        "can_send_messages": true,
        "can_edit_wedding_details": false,
        "can_manage_vendors": false,
        "can_view_budget": false
      }'::jsonb as permissions,
      v.created_at as joined_at
    FROM vendors v
    WHERE v.user_id IS NOT NULL
    ON CONFLICT (wedding_id, user_id) DO NOTHING;
  END IF;
END $$;

-- Note: We keep couple_id and partner_id in weddings table for now
-- They can be removed in a future migration after verifying the new system works
-- This allows for a gradual transition

-- Create helper function to check if user has specific permission in a wedding
CREATE OR REPLACE FUNCTION has_wedding_permission(
  p_wedding_id UUID,
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM wedding_members
    WHERE wedding_id = p_wedding_id
    AND user_id = p_user_id
    AND (permissions ->> p_permission)::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user's role in a wedding
CREATE OR REPLACE FUNCTION get_wedding_role(
  p_wedding_id UUID,
  p_user_id UUID
)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM wedding_members
    WHERE wedding_id = p_wedding_id
    AND user_id = p_user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get all weddings for a user with their role
CREATE OR REPLACE FUNCTION get_user_weddings(p_user_id UUID)
RETURNS TABLE (
  wedding_id UUID,
  role TEXT,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wm.wedding_id,
    wm.role,
    wm.permissions
  FROM wedding_members wm
  WHERE wm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
