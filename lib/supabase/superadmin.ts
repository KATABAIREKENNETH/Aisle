import { supabase } from './client';
import type { User } from '../../types';

export async function isSuperadmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.role === 'superadmin';
}

export async function getCurrentUserRole(): Promise<string | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !data) return null;
  return data.role;
}

export async function requireSuperadmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'superadmin';
}
