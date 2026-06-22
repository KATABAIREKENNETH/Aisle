-- Migration: Add phone number and currency fields
-- This migration adds phone number to profiles and currency to users/weddings
-- Run this in Supabase SQL Editor

-- Add phone column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add currency column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'UGX';

-- Add currency column to weddings table
ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'UGX';

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Add constraint for valid currency codes
ALTER TABLE profiles 
ADD CONSTRAINT check_valid_currency CHECK (currency IN ('UGX', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'RWF', 'BIF', 'CDF', 'ZAR', 'NGN', 'GHS', 'XOF', 'XAF'));

ALTER TABLE weddings 
ADD CONSTRAINT check_wedding_valid_currency CHECK (currency IN ('UGX', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'RWF', 'BIF', 'CDF', 'ZAR', 'NGN', 'GHS', 'XOF', 'XAF'));

-- Add comment to document the changes
COMMENT ON COLUMN profiles.phone IS 'User phone number with country code (e.g., +256700123456)';
COMMENT ON COLUMN profiles.currency IS 'User preferred currency for displaying prices';
COMMENT ON COLUMN weddings.currency IS 'Wedding budget currency';
