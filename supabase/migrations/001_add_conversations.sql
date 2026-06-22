-- Migration: Add conversation tables
-- This migration adds the conversations, conversation_participants, and messages tables
-- Run this in Supabase SQL Editor to set up the messaging system

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations Table (for group and individual messaging)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT,
  is_group BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_wedding_id ON conversations(wedding_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Enable RLS on tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Superadmins can view all conversations') THEN
    CREATE POLICY "Superadmins can view all conversations" ON conversations
      FOR SELECT USING (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can view conversations from own weddings') THEN
    CREATE POLICY "Users can view conversations from own weddings" ON conversations
      FOR SELECT USING (conversations.wedding_id IN (SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Superadmins can insert conversations') THEN
    CREATE POLICY "Superadmins can insert conversations" ON conversations
      FOR INSERT WITH CHECK (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can insert conversations to own weddings') THEN
    CREATE POLICY "Users can insert conversations to own weddings" ON conversations
      FOR INSERT WITH CHECK (conversations.wedding_id IN (SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()) AND created_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Superadmins can update all conversations') THEN
    CREATE POLICY "Superadmins can update all conversations" ON conversations
      FOR UPDATE USING (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can update conversations they created') THEN
    CREATE POLICY "Users can update conversations they created" ON conversations
      FOR UPDATE USING (created_by = auth.uid());
  END IF;
END $$;

-- Conversation Participants RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Superadmins can view all conversation participants') THEN
    CREATE POLICY "Superadmins can view all conversation participants" ON conversation_participants
      FOR SELECT USING (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can view conversation participants they belong to') THEN
    CREATE POLICY "Users can view conversation participants they belong to" ON conversation_participants
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Superadmins can insert conversation participants') THEN
    CREATE POLICY "Superadmins can insert conversation participants" ON conversation_participants
      FOR INSERT WITH CHECK (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can insert conversation participants to their conversations') THEN
    CREATE POLICY "Users can insert conversation participants to their conversations" ON conversation_participants
      FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE created_by = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Superadmins can update all conversation participants') THEN
    CREATE POLICY "Superadmins can update all conversation participants" ON conversation_participants
      FOR UPDATE USING (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can update their own participant role') THEN
    CREATE POLICY "Users can update their own participant role" ON conversation_participants
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Superadmins can delete all conversation participants') THEN
    CREATE POLICY "Superadmins can delete all conversation participants" ON conversation_participants
      FOR DELETE USING (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can delete conversation participants from their conversations') THEN
    CREATE POLICY "Users can delete conversation participants from their conversations" ON conversation_participants
      FOR DELETE USING (conversation_id IN (SELECT id FROM conversations WHERE created_by = auth.uid()));
  END IF;
END $$;

-- Messages RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Superadmins can view all messages') THEN
    CREATE POLICY "Superadmins can view all messages" ON messages
      FOR SELECT USING (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages from conversations they belong to') THEN
    CREATE POLICY "Users can view messages from conversations they belong to" ON messages
      FOR SELECT USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Superadmins can insert messages') THEN
    CREATE POLICY "Superadmins can insert messages" ON messages
      FOR INSERT WITH CHECK (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert messages to conversations they belong to') THEN
    CREATE POLICY "Users can insert messages to conversations they belong to" ON messages
      FOR INSERT WITH CHECK (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()) AND sender_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Superadmins can update all messages') THEN
    CREATE POLICY "Superadmins can update all messages" ON messages
      FOR UPDATE USING (public.is_superadmin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update messages they sent') THEN
    CREATE POLICY "Users can update messages they sent" ON messages
      FOR UPDATE USING (sender_id = auth.uid());
  END IF;
END $$;
