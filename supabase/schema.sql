-- Aisle Wedding Planning App - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'couple' CHECK (role IN ('couple', 'planner', 'vendor', 'guest', 'superadmin')),
  is_banned BOOLEAN DEFAULT false,
  banned_at TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weddings Table
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  wedding_date DATE NOT NULL,
  wedding_location TEXT,
  venue_name TEXT,
  budget DECIMAL(10,2),
  guest_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Categories Table
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  status TEXT DEFAULT 'researching' CHECK (status IN ('researching', 'contacted', 'quoted', 'booked', 'paid')),
  quoted_amount DECIMAL(10,2),
  actual_amount DECIMAL(10,2),
  contract_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invitation_sent BOOLEAN DEFAULT false,
  invitation_accepted BOOLEAN DEFAULT false,
  invitation_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guests Table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  dietary_needs TEXT,
  plus_one BOOLEAN DEFAULT false,
  plus_one_name TEXT,
  group_tag TEXT,
  rsvp_status TEXT DEFAULT 'invited' CHECK (rsvp_status IN ('invited', 'opened', 'attending', 'declined', 'no_response')),
  meal_preference TEXT,
  accommodation_needed BOOLEAN DEFAULT false,
  accessibility_needs TEXT,
  children_count INTEGER DEFAULT 0,
  table_number TEXT,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invitation_sent BOOLEAN DEFAULT false,
  invitation_accepted BOOLEAN DEFAULT false,
  invitation_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Activity Log Table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  action_category TEXT DEFAULT 'general',
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for better performance
CREATE INDEX idx_weddings_couple_id ON weddings(couple_id);
CREATE INDEX idx_weddings_partner_id ON weddings(partner_id);
CREATE INDEX idx_tasks_wedding_id ON tasks(wedding_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_budget_categories_wedding_id ON budget_categories(wedding_id);
CREATE INDEX idx_expenses_wedding_id ON expenses(wedding_id);
CREATE INDEX idx_vendors_wedding_id ON vendors(wedding_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX idx_appointments_wedding_id ON appointments(wedding_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_messages_wedding_id ON messages(wedding_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_conversations_wedding_id ON conversations(wedding_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_activity_log_wedding_id ON activity_log(wedding_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weddings_updated_at BEFORE UPDATE ON weddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Helper: read role from JWT claim instead of querying profiles.
-- This prevents infinite recursion in policies that check the profiles table.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin',
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Superadmins can view all profiles" ON profiles
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Superadmins can update all profiles" ON profiles
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Superadmins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Weddings RLS
CREATE POLICY "Superadmins can view all weddings" ON weddings
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view own weddings" ON weddings
  FOR SELECT USING (couple_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "Superadmins can update all weddings" ON weddings
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update own weddings" ON weddings
  FOR UPDATE USING (couple_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "Superadmins can insert weddings" ON weddings
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert own weddings" ON weddings
  FOR INSERT WITH CHECK (couple_id = auth.uid());

-- Tasks RLS
CREATE POLICY "Superadmins can view all tasks" ON tasks
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view tasks from own weddings" ON tasks
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert tasks to own weddings" ON tasks
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can update all tasks" ON tasks
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update tasks from own weddings" ON tasks
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can delete all tasks" ON tasks
  FOR DELETE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can delete tasks from own weddings" ON tasks
  FOR DELETE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Budget Categories RLS
CREATE POLICY "Superadmins can view all budget categories" ON budget_categories
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view budget categories from own weddings" ON budget_categories
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert budget categories" ON budget_categories
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert budget categories to own weddings" ON budget_categories
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can update all budget categories" ON budget_categories
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update budget categories from own weddings" ON budget_categories
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Expenses RLS
CREATE POLICY "Superadmins can view all expenses" ON expenses
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view expenses from own weddings" ON expenses
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert expenses" ON expenses
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert expenses to own weddings" ON expenses
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can update all expenses" ON expenses
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update expenses from own weddings" ON expenses
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can delete all expenses" ON expenses
  FOR DELETE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can delete expenses from own weddings" ON expenses
  FOR DELETE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Vendors RLS
CREATE POLICY "Superadmins can view all vendors" ON vendors
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view vendors from own weddings" ON vendors
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert vendors" ON vendors
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert vendors to own weddings" ON vendors
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can update all vendors" ON vendors
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update vendors from own weddings" ON vendors
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can delete all vendors" ON vendors
  FOR DELETE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can delete vendors from own weddings" ON vendors
  FOR DELETE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Guests RLS
CREATE POLICY "Superadmins can view all guests" ON guests
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view guests from own weddings" ON guests
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert guests" ON guests
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert guests to own weddings" ON guests
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can update all guests" ON guests
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update guests from own weddings" ON guests
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can delete all guests" ON guests
  FOR DELETE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can delete guests from own weddings" ON guests
  FOR DELETE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Appointments RLS
CREATE POLICY "Superadmins can view all appointments" ON appointments
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view appointments from own weddings" ON appointments
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert appointments" ON appointments
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert appointments to own weddings" ON appointments
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can update all appointments" ON appointments
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update appointments from own weddings" ON appointments
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Conversations RLS
CREATE POLICY "Superadmins can view all conversations" ON conversations
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view conversations from own weddings" ON conversations
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert conversations" ON conversations
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert conversations to own weddings" ON conversations
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Superadmins can update all conversations" ON conversations
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update conversations they created" ON conversations
  FOR UPDATE USING (created_by = auth.uid());

-- Conversation Participants RLS
CREATE POLICY "Superadmins can view all conversation participants" ON conversation_participants
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view conversation participants they belong to" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Superadmins can insert conversation participants" ON conversation_participants
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert conversation participants to their conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Superadmins can update all conversation participants" ON conversation_participants
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update their own participant role" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Superadmins can delete all conversation participants" ON conversation_participants
  FOR DELETE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can delete conversation participants from their conversations" ON conversation_participants
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
  );

-- Messages RLS
CREATE POLICY "Superadmins can view all messages" ON messages
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view messages from conversations they belong to" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert messages" ON messages
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert messages to conversations they belong to" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    ) AND sender_id = auth.uid()
  );

CREATE POLICY "Superadmins can update all messages" ON messages
  FOR UPDATE USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can update messages they sent" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Activity Log RLS
CREATE POLICY "Superadmins can view all activity logs" ON activity_log
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Users can view activity log from own weddings" ON activity_log
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can insert activity logs" ON activity_log
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Users can insert activity log to own weddings" ON activity_log
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM weddings WHERE couple_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Analytics & Metrics Tables

-- App Analytics Table
CREATE TABLE app_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  screen_name TEXT NOT NULL,
  feature_used TEXT,
  action_type TEXT,
  duration_seconds INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB,
  metadata JSONB
);

-- Conversion Funnel Table
CREATE TABLE conversion_funnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  step TEXT NOT NULL,
  step_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_to_complete_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Retention Metrics Table
CREATE TABLE retention_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cohort_date DATE NOT NULL,
  activity_date DATE NOT NULL,
  days_active INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  features_used TEXT[],
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Intelligence Tables

-- Revenue Tracking Table
CREATE TABLE revenue_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
  subscription_type TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_fee DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Insights Table
CREATE TABLE market_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT,
  country TEXT,
  city TEXT,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2),
  count INTEGER,
  average_budget DECIMAL(10,2),
  popular_vendor_categories TEXT[],
  data_period_start DATE,
  data_period_end DATE,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Seasonal Trends Table
CREATE TABLE seasonal_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  season TEXT,
  wedding_count INTEGER DEFAULT 0,
  average_budget DECIMAL(10,2),
  popular_venues TEXT[],
  popular_vendor_categories TEXT[],
  average_guest_count INTEGER,
  booking_lead_time_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- System Health Tables

-- Error Logs Table
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  screen_name TEXT,
  action_type TEXT,
  device_info JSONB,
  app_version TEXT,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value DECIMAL(10,2),
  unit TEXT,
  screen_name TEXT,
  endpoint TEXT,
  load_time_ms DECIMAL(10,2),
  response_time_ms DECIMAL(10,2),
  memory_usage_mb DECIMAL(10,2),
  device_info JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Security Events Table
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  device_info JSONB,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for analytics tables
CREATE INDEX idx_app_analytics_user_id ON app_analytics(user_id);
CREATE INDEX idx_app_analytics_timestamp ON app_analytics(timestamp);
CREATE INDEX idx_app_analytics_screen_name ON app_analytics(screen_name);
CREATE INDEX idx_conversion_funnel_user_id ON conversion_funnel(user_id);
CREATE INDEX idx_conversion_funnel_step ON conversion_funnel(step);
CREATE INDEX idx_retention_metrics_user_id ON retention_metrics(user_id);
CREATE INDEX idx_retention_metrics_cohort_date ON retention_metrics(cohort_date);
CREATE INDEX idx_revenue_tracking_user_id ON revenue_tracking(user_id);
CREATE INDEX idx_revenue_tracking_status ON revenue_tracking(status);
CREATE INDEX idx_revenue_tracking_created_at ON revenue_tracking(created_at);
CREATE INDEX idx_market_insights_region ON market_insights(region);
CREATE INDEX idx_market_insights_metric_type ON market_insights(metric_type);
CREATE INDEX idx_seasonal_trends_year_month ON seasonal_trends(year, month);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_status ON security_events(status);

-- Enable RLS on analytics tables
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- App Analytics RLS
CREATE POLICY "Superadmins can view all app analytics" ON app_analytics
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert app analytics" ON app_analytics
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

-- Conversion Funnel RLS
CREATE POLICY "Superadmins can view all conversion funnel data" ON conversion_funnel
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert conversion funnel data" ON conversion_funnel
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

-- Retention Metrics RLS
CREATE POLICY "Superadmins can view all retention metrics" ON retention_metrics
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert retention metrics" ON retention_metrics
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

-- Revenue Tracking RLS
CREATE POLICY "Superadmins can view all revenue tracking" ON revenue_tracking
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert revenue tracking" ON revenue_tracking
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can update revenue tracking" ON revenue_tracking
  FOR UPDATE USING (
    public.is_superadmin()
  );

-- Market Insights RLS
CREATE POLICY "Superadmins can view all market insights" ON market_insights
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert market insights" ON market_insights
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

-- Seasonal Trends RLS
CREATE POLICY "Superadmins can view all seasonal trends" ON seasonal_trends
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert seasonal trends" ON seasonal_trends
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

-- Error Logs RLS
CREATE POLICY "Superadmins can view all error logs" ON error_logs
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can update error logs" ON error_logs
  FOR UPDATE USING (
    public.is_superadmin()
  );

-- Performance Metrics RLS
CREATE POLICY "Superadmins can view all performance metrics" ON performance_metrics
  FOR SELECT USING (
    public.is_superadmin()
  );

CREATE POLICY "Superadmins can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (
    public.is_superadmin()
  );

-- Security Events RLS
CREATE POLICY "Superadmins can view all security events" ON security_events
  FOR SELECT USING (
    public.is_superadmin()
  );

-- Allow any caller (including unauthenticated) to INSERT security events.
-- This is necessary for logging failed logins before a session exists.
CREATE POLICY "Anyone can insert security events" ON security_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Superadmins can update security events" ON security_events
  FOR UPDATE USING (
    public.is_superadmin()
  );

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Analytics Calculation Functions

-- Function to calculate market insights from wedding data
CREATE OR REPLACE FUNCTION calculate_market_insights()
RETURNS VOID AS $$
BEGIN
  -- Calculate average budget by region
  INSERT INTO market_insights (region, metric_type, metric_name, metric_value, count, average_budget, data_period_start, data_period_end)
  SELECT
    COALESCE(w.wedding_location, 'Unknown') as region,
    'budget' as metric_type,
    'average_budget' as metric_name,
    AVG(w.budget) as metric_value,
    COUNT(*) as count,
    AVG(w.budget) as average_budget,
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') as data_period_start,
    DATE_TRUNC('month', CURRENT_DATE) as data_period_end
  FROM weddings w
  WHERE w.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  GROUP BY w.wedding_location
  ON CONFLICT DO NOTHING;

  -- Calculate popular vendor categories
  INSERT INTO market_insights (metric_type, metric_name, popular_vendor_categories, count, data_period_start, data_period_end)
  SELECT
    'vendors' as metric_type,
    'popular_categories' as metric_name,
    ARRAY_AGG(DISTINCT v.category) as popular_vendor_categories,
    COUNT(*) as count,
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') as data_period_start,
    DATE_TRUNC('month', CURRENT_DATE) as data_period_end
  FROM vendors v
  WHERE v.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  GROUP BY v.category
  ON CONFLICT DO NOTHING;

  -- Calculate guest count statistics
  INSERT INTO market_insights (metric_type, metric_name, metric_value, count, data_period_start, data_period_end)
  SELECT
    'guests' as metric_type,
    'average_guest_count' as metric_name,
    AVG(w.guest_count) as metric_value,
    COUNT(*) as count,
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') as data_period_start,
    DATE_TRUNC('month', CURRENT_DATE) as data_period_end
  FROM weddings w
  WHERE w.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND w.guest_count IS NOT NULL
  GROUP BY w.guest_count
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate seasonal trends
CREATE OR REPLACE FUNCTION calculate_seasonal_trends()
RETURNS VOID AS $$
BEGIN
  -- Calculate trends for each month of current year
  INSERT INTO seasonal_trends (year, month, season, wedding_count, average_budget, average_guest_count)
  SELECT
    EXTRACT(YEAR FROM w.wedding_date) as year,
    EXTRACT(MONTH FROM w.wedding_date) as month,
    CASE
      WHEN EXTRACT(MONTH FROM w.wedding_date) IN (12, 1, 2) THEN 'winter'
      WHEN EXTRACT(MONTH FROM w.wedding_date) IN (3, 4, 5) THEN 'spring'
      WHEN EXTRACT(MONTH FROM w.wedding_date) IN (6, 7, 8) THEN 'summer'
      ELSE 'fall'
    END as season,
    COUNT(*) as wedding_count,
    AVG(w.budget) as average_budget,
    AVG(w.guest_count) as average_guest_count
  FROM weddings w
  WHERE w.wedding_date >= DATE_TRUNC('year', CURRENT_DATE)
    AND w.wedding_date < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
  GROUP BY
    EXTRACT(YEAR FROM w.wedding_date),
    EXTRACT(MONTH FROM w.wedding_date)
  ON CONFLICT DO NOTHING;

  -- Calculate popular venues by season
  INSERT INTO seasonal_trends (year, month, season, popular_venues)
  SELECT DISTINCT
    EXTRACT(YEAR FROM w.wedding_date) as year,
    EXTRACT(MONTH FROM w.wedding_date) as month,
    CASE
      WHEN EXTRACT(MONTH FROM w.wedding_date) IN (12, 1, 2) THEN 'winter'
      WHEN EXTRACT(MONTH FROM w.wedding_date) IN (3, 4, 5) THEN 'spring'
      WHEN EXTRACT(MONTH FROM w.wedding_date) IN (6, 7, 8) THEN 'summer'
      ELSE 'fall'
    END as season,
    ARRAY_AGG(DISTINCT w.venue_name) OVER (PARTITION BY EXTRACT(YEAR FROM w.wedding_date), EXTRACT(MONTH FROM w.wedding_date)) as popular_venues
  FROM weddings w
  WHERE w.wedding_date >= DATE_TRUNC('year', CURRENT_DATE)
    AND w.wedding_date < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
    AND w.venue_name IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- Calculate booking lead time
  INSERT INTO seasonal_trends (year, month, booking_lead_time_days)
  SELECT
    EXTRACT(YEAR FROM w.wedding_date) as year,
    EXTRACT(MONTH FROM w.wedding_date) as month,
    AVG(EXTRACT(DAY FROM (w.wedding_date - w.created_at))) as booking_lead_time_days
  FROM weddings w
  WHERE w.wedding_date >= DATE_TRUNC('year', CURRENT_DATE)
    AND w.wedding_date < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
  GROUP BY
    EXTRACT(YEAR FROM w.wedding_date),
    EXTRACT(MONTH FROM w.wedding_date)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate retention metrics
CREATE OR REPLACE FUNCTION calculate_retention_metrics()
RETURNS VOID AS $$
BEGIN
  -- Calculate daily active users
  INSERT INTO retention_metrics (user_id, cohort_date, activity_date, days_active, sessions_count, features_used)
  SELECT
    p.id as user_id,
    DATE_TRUNC('day', p.created_at) as cohort_date,
    DATE_TRUNC('day', CURRENT_DATE) as activity_date,
    1 as days_active,
    COUNT(DISTINCT al.id) as sessions_count,
    ARRAY_AGG(DISTINCT al.action_type) as features_used
  FROM profiles p
  LEFT JOIN activity_log al ON p.id = al.user_id
    AND DATE_TRUNC('day', al.created_at) = DATE_TRUNC('day', CURRENT_DATE)
  WHERE p.created_at >= DATE_TRUNC('day', CURRENT_DATE - INTERVAL '30 days')
  GROUP BY p.id, DATE_TRUNC('day', p.created_at)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
