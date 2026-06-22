-- Migration: Fix ALL conversations RLS policies with table aliases
-- This completely drops and recreates all conversation-related policies to ensure no ambiguity
-- Run this in Supabase SQL Editor

-- Drop ALL existing conversation policies
DROP POLICY IF EXISTS "Superadmins can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations from own weddings" ON conversations;
DROP POLICY IF EXISTS "Superadmins can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations to own weddings" ON conversations;
DROP POLICY IF EXISTS "Superadmins can update all conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;

-- Recreate all policies with table aliases
CREATE POLICY "Superadmins can view all conversations" ON conversations
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Users can view conversations from own weddings" ON conversations
  FOR SELECT USING (conversations.wedding_id IN (SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()));

CREATE POLICY "Superadmins can insert conversations" ON conversations
  FOR INSERT WITH CHECK (public.is_superadmin());

CREATE POLICY "Users can insert conversations to own weddings" ON conversations
  FOR INSERT WITH CHECK (conversations.wedding_id IN (SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Superadmins can update all conversations" ON conversations
  FOR UPDATE USING (public.is_superadmin());

CREATE POLICY "Users can update conversations they created" ON conversations
  FOR UPDATE USING (created_by = auth.uid());
