-- Migration: Fix weddings RLS to support both old and new patterns
-- This allows queries using couple_id/partner_id OR wedding_members

-- Drop existing weddings RLS policies (drop all possible names)
DROP POLICY IF EXISTS "Superadmins can view all weddings" ON weddings;
DROP POLICY IF EXISTS "Users can view own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can view weddings they are members of" ON weddings;
DROP POLICY IF EXISTS "Superadmins can update all weddings" ON weddings;
DROP POLICY IF EXISTS "Users can update own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can update weddings they are couple/partner/planner in" ON weddings;
DROP POLICY IF EXISTS "Superadmins can insert weddings" ON weddings;
DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can insert weddings" ON weddings;

-- Create hybrid SELECT policy that supports both patterns
CREATE POLICY "Superadmins can view all weddings" ON weddings
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Users can view own weddings" ON weddings
  FOR SELECT USING (
    couple_id = auth.uid() OR 
    partner_id = auth.uid() OR
    id IN (SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid())
  );

-- Create hybrid UPDATE policy that supports both patterns
CREATE POLICY "Superadmins can update all weddings" ON weddings
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Users can update own weddings" ON weddings
  FOR UPDATE USING (
    couple_id = auth.uid() OR 
    partner_id = auth.uid() OR
    id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() 
      AND role IN ('couple', 'partner', 'planner')
    )
  );

-- Create hybrid INSERT policy that supports both patterns
CREATE POLICY "Superadmins can insert weddings" ON weddings
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Users can insert own weddings" ON weddings
  FOR INSERT WITH CHECK (
    couple_id = auth.uid() OR 
    partner_id = auth.uid()
  );

-- Fix budget_categories RLS to support both old and new patterns
DROP POLICY IF EXISTS "Superadmins can view all budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can view budget categories from own weddings" ON budget_categories;
DROP POLICY IF EXISTS "Users can view budget categories from weddings they are members of" ON budget_categories;
DROP POLICY IF EXISTS "Superadmins can insert budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can insert budget categories to own weddings" ON budget_categories;
DROP POLICY IF EXISTS "Users can insert budget categories to weddings they have permission" ON budget_categories;
DROP POLICY IF EXISTS "Superadmins can update all budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories from own weddings" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories from weddings they have permission" ON budget_categories;

CREATE POLICY "Superadmins can view all budget categories" ON budget_categories
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Users can view budget categories from own weddings" ON budget_categories
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    ) OR
    wedding_id IN (SELECT wedding_id FROM wedding_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Superadmins can insert budget categories" ON budget_categories
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Users can insert budget categories to own weddings" ON budget_categories
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    ) OR
    wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() 
      AND (permissions ->> 'can_edit_budget')::boolean = true
    )
  );

CREATE POLICY "Superadmins can update all budget categories" ON budget_categories
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Users can update budget categories from own weddings" ON budget_categories
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    ) OR
    wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() 
      AND (permissions ->> 'can_edit_budget')::boolean = true
    )
  );

-- Fix expenses RLS to support both old and new patterns
DROP POLICY IF EXISTS "Superadmins can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view expenses from own weddings" ON expenses;
DROP POLICY IF EXISTS "Users can view expenses from weddings they are members of" ON expenses;
DROP POLICY IF EXISTS "Superadmins can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses to own weddings" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses to weddings they have permission" ON expenses;
DROP POLICY IF EXISTS "Superadmins can update all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses from own weddings" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses from weddings they have permission" ON expenses;
DROP POLICY IF EXISTS "Superadmins can delete all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses from own weddings" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses from weddings they have permission" ON expenses;

CREATE POLICY "Superadmins can view all expenses" ON expenses
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Users can view expenses from own weddings" ON expenses
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    ) OR
    wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() 
      AND (permissions ->> 'can_view_budget')::boolean = true
    )
  );

CREATE POLICY "Superadmins can insert expenses" ON expenses
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Users can insert expenses to own weddings" ON expenses
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    ) OR
    wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() 
      AND (permissions ->> 'can_edit_budget')::boolean = true
    )
  );

CREATE POLICY "Superadmins can update all expenses" ON expenses
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Users can update expenses from own weddings" ON expenses
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    ) OR
    wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() 
      AND (permissions ->> 'can_edit_budget')::boolean = true
    )
  );

CREATE POLICY "Superadmins can delete all expenses" ON expenses
  FOR DELETE USING (public.is_superadmin());

CREATE POLICY "Users can delete expenses from own weddings" ON expenses
  FOR DELETE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    ) OR
    wedding_id IN (
      SELECT wedding_id FROM wedding_members 
      WHERE user_id = auth.uid() 
      AND (permissions ->> 'can_edit_budget')::boolean = true
    )
  );
