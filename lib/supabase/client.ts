import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Please set EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

/**
 * Cross-platform storage adapter:
 * - Native (iOS/Android): expo-secure-store (encrypted)
 * - Web: localStorage
 *
 * SecureStore keys must be ≤ 255 chars and contain only alphanumeric, '.', '-', '_'.
 * Supabase auth keys can contain '-' which is fine, but we strip any other unsafe chars.
 */
const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9._-]/g, '_');

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(sanitizeKey(key)),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(sanitizeKey(key), value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(sanitizeKey(key)),
};

const WebLocalStorageAdapter = {
  getItem: (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem: (key: string): void => {
    try { localStorage.removeItem(key); } catch {}
  },
};

const storage = Platform.OS === 'web' ? WebLocalStorageAdapter : ExpoSecureStoreAdapter;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
