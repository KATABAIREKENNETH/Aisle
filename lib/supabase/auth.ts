import { supabase } from './client';
import type { AuthSession, User } from '../../types';
import { logFailedLogin, logSuccessfulLogin, logPasswordReset } from '../analytics/security';

export async function signUp(email: string, password: string, fullName: string, phone?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) {
    await logFailedLogin(email, error.message);
    throw error;
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await logFailedLogin(email, error.message);
    throw error;
  }

  if (data.user) {
    await logSuccessfulLogin(data.user.id);
  }

  return data;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    await logFailedLogin(email, 'Password reset request failed');
    throw error;
  }
  await logPasswordReset(email);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return { subscription };
}

// Password Management
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

export async function confirmPasswordReset(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

// Profile Management
export async function updateProfile(metadata: { full_name?: string; avatar_url?: string }) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) throw error;
  return data;
}

export async function deleteAccount() {
  const { error } = await supabase.auth.admin.deleteUser(
    (await getCurrentUser())?.id || ''
  );

  if (error) throw error;
}

// Session Management
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) throw error;
  return data;
}
