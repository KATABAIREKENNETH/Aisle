-- Migration: Fix ambiguous wedding_id reference in conversations RLS policies
-- This fixes PostgreSQL error 42702 (ambiguous column reference)
-- Run this in Supabase SQL Editor

-- Drop and recreate the problematic policies with table aliases

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations from own weddings" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations to own weddings" ON conversations;

-- Recreate with table aliases to avoid ambiguity
CREATE POLICY "Users can view conversations from own weddings" ON conversations
  FOR SELECT USING (conversations.wedding_id IN (SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()));

CREATE POLICY "Users can insert conversations to own weddings" ON conversations
  FOR INSERT WITH CHECK (conversations.wedding_id IN (SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()) AND created_by = auth.uid());
