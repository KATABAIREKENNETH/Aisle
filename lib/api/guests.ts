import { supabase } from '../supabase/client';
import type { Guest, GuestFormData } from '../../types';

export async function getGuests(weddingId: string) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Guest[];
}

export async function getGuestById(guestId: string) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single();

  if (error) throw error;
  return data as Guest;
}

export async function createGuest(weddingId: string, guestData: GuestFormData) {
  const { data, error } = await supabase
    .from('guests')
    .insert({
      wedding_id: weddingId,
      ...guestData,
      children_count: guestData.children_count || 0,
      accommodation_needed: guestData.accommodation_needed || false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Guest;
}

export async function updateGuest(guestId: string, updates: Partial<GuestFormData>) {
  const { data, error } = await supabase
    .from('guests')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) throw error;
  return data as Guest;
}

export async function deleteGuest(guestId: string) {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', guestId);

  if (error) throw error;
}

export async function updateRSVPStatus(guestId: string, status: 'invited' | 'opened' | 'attending' | 'declined' | 'no_response') {
  const { data, error } = await supabase
    .from('guests')
    .update({
      rsvp_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) throw error;
  return data as Guest;
}
