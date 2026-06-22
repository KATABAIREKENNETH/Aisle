import { supabase } from '../supabase/client';
import type { Wedding, WeddingFormData, WeddingMember, UserWeddingContext } from '../../types';

export async function getWeddingByUserId(userId: string) {
  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .or(`couple_id.eq.${userId},partner_id.eq.${userId}`)
    .single();

  if (error) {
    // If no wedding found, return null instead of throwing
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data as Wedding | null;
}

export async function getUserWeddings(userId: string) {
  const { data, error } = await supabase
    .from('wedding_members')
    .select(`
      wedding_id,
      role,
      permissions,
      weddings!inner (
        id,
        couple_id,
        partner_id,
        wedding_date,
        wedding_location,
        venue_name,
        budget,
        guest_count,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  
  return data?.map(member => {
    const weddingData = Array.isArray(member.weddings) ? member.weddings[0] : member.weddings;
    return {
      wedding_id: member.wedding_id,
      role: member.role,
      permissions: member.permissions as any,
      wedding: weddingData as unknown as Wedding,
    };
  }) || [];
}

export async function getWeddingMember(weddingId: string, userId: string) {
  const { data, error } = await supabase
    .from('wedding_members')
    .select('*')
    .eq('wedding_id', weddingId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as WeddingMember;
}

export async function createWedding(userId: string, weddingData: WeddingFormData) {
  const { data: weddingDataResult, error: weddingError } = await supabase
    .from('weddings')
    .insert({
      couple_id: userId,
      wedding_date: weddingData.weddingDate,
      wedding_location: weddingData.weddingLocation,
      budget: weddingData.budget ? parseFloat(weddingData.budget) : null,
      guest_count: weddingData.guestCount ? parseInt(weddingData.guestCount) : null,
    })
    .select()
    .single();

  if (weddingError) throw weddingError;
  
  const wedding = weddingDataResult as Wedding;
  
  // Create wedding_members entry for the couple
  const { error: memberError } = await supabase
    .from('wedding_members')
    .insert({
      wedding_id: wedding.id,
      user_id: userId,
      role: 'couple',
      permissions: {
        can_edit_budget: true,
        can_manage_guests: true,
        can_view_tasks: true,
        can_assign_tasks: true,
        can_send_messages: true,
        can_edit_wedding_details: true,
        can_manage_vendors: true,
        can_view_budget: true,
      },
    });

  if (memberError) throw memberError;
  
  return wedding;
}

export async function updateWedding(weddingId: string, updates: Partial<WeddingFormData>) {
  const dbUpdates: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.weddingDate !== undefined) dbUpdates.wedding_date = updates.weddingDate;
  if (updates.weddingLocation !== undefined) dbUpdates.wedding_location = updates.weddingLocation;
  if (updates.venueName !== undefined) dbUpdates.venue_name = updates.venueName;
  if (updates.budget !== undefined) dbUpdates.budget = updates.budget ? parseFloat(updates.budget) : null;
  if (updates.guestCount !== undefined) dbUpdates.guest_count = updates.guestCount ? parseInt(updates.guestCount) : null;

  const { data, error } = await supabase
    .from('weddings')
    .update(dbUpdates)
    .eq('id', weddingId)
    .select()
    .single();

  if (error) throw error;
  return data as Wedding;
}

export async function initializeDefaultTasks(weddingId: string) {
  const defaultTasks = [
    // 12 months out
    { title: 'Set wedding date', category: 'general', priority: 'high' as const, due_date: null },
    { title: 'Set budget', category: 'budget', priority: 'high' as const, due_date: null },
    { title: 'Create guest list', category: 'guests', priority: 'high' as const, due_date: null },
    
    // 9-11 months out
    { title: 'Book venue', category: 'venue', priority: 'high' as const, due_date: null },
    { title: 'Research photographers', category: 'photography', priority: 'medium' as const, due_date: null },
    { title: 'Research caterers', category: 'catering', priority: 'medium' as const, due_date: null },
    
    // 6-8 months out
    { title: 'Book photographer', category: 'photography', priority: 'high' as const, due_date: null },
    { title: 'Book caterer', category: 'catering', priority: 'high' as const, due_date: null },
    { title: 'Order wedding dress', category: 'attire', priority: 'high' as const, due_date: null },
    
    // 3-5 months out
    { title: 'Send save-the-dates', category: 'guests', priority: 'medium' as const, due_date: null },
    { title: 'Book florist', category: 'florals', priority: 'medium' as const, due_date: null },
    { title: 'Book entertainment', category: 'music', priority: 'medium' as const, due_date: null },
    
    // 1-2 months out
    { title: 'Send formal invitations', category: 'guests', priority: 'high' as const, due_date: null },
    { title: 'Final dress fitting', category: 'attire', priority: 'high' as const, due_date: null },
    { title: 'Finalize menu with caterer', category: 'catering', priority: 'high' as const, due_date: null },
    
    // 1 month out
    { title: 'Final guest count', category: 'guests', priority: 'high' as const, due_date: null },
    { title: 'Confirm all vendors', category: 'general', priority: 'high' as const, due_date: null },
    { title: 'Create seating chart', category: 'guests', priority: 'medium' as const, due_date: null },
  ];

  const { data, error } = await supabase
    .from('tasks')
    .insert(
      defaultTasks.map(task => ({
        wedding_id: weddingId,
        ...task,
        status: 'pending',
      }))
    )
    .select();

  if (error) throw error;
  return data;
}

export async function sendPartnerInvite(weddingId: string, partnerEmail: string, partnerName?: string) {
  // Generate a unique invite code
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const { data, error } = await supabase
    .from('weddings')
    .update({
      partner_invite_code: inviteCode,
      partner_invite_email: partnerEmail,
      partner_invite_name: partnerName || null,
      partner_invite_sent_at: new Date().toISOString(),
    })
    .eq('id', weddingId)
    .select()
    .single();

  if (error) throw error;
  
  // In a real implementation, you would send an email here
  // For now, we return the invite code that can be used to generate a link
  return { wedding: data as Wedding, inviteCode };
}

export async function addWeddingMember(weddingId: string, userId: string, role: 'couple' | 'partner' | 'planner' | 'vendor' | 'guest', permissions?: any) {
  const defaultPermissions = {
    can_edit_budget: false,
    can_manage_guests: false,
    can_view_tasks: true,
    can_assign_tasks: false,
    can_send_messages: true,
    can_edit_wedding_details: false,
    can_manage_vendors: false,
    can_view_budget: false,
  };

  const rolePermissions: Record<string, any> = {
    couple: {
      can_edit_budget: true,
      can_manage_guests: true,
      can_view_tasks: true,
      can_assign_tasks: true,
      can_send_messages: true,
      can_edit_wedding_details: true,
      can_manage_vendors: true,
      can_view_budget: true,
    },
    partner: {
      can_edit_budget: true,
      can_manage_guests: true,
      can_view_tasks: true,
      can_assign_tasks: true,
      can_send_messages: true,
      can_edit_wedding_details: true,
      can_manage_vendors: true,
      can_view_budget: true,
    },
    planner: {
      can_edit_budget: true,
      can_manage_guests: true,
      can_view_tasks: true,
      can_assign_tasks: true,
      can_send_messages: true,
      can_edit_wedding_details: true,
      can_manage_vendors: true,
      can_view_budget: true,
    },
    vendor: {
      can_edit_budget: false,
      can_manage_guests: false,
      can_view_tasks: true,
      can_assign_tasks: false,
      can_send_messages: true,
      can_edit_wedding_details: false,
      can_manage_vendors: false,
      can_view_budget: false,
    },
    guest: {
      can_edit_budget: false,
      can_manage_guests: false,
      can_view_tasks: false,
      can_assign_tasks: false,
      can_send_messages: true,
      can_edit_wedding_details: false,
      can_manage_vendors: false,
      can_view_budget: false,
    },
  };

  const { data, error } = await supabase
    .from('wedding_members')
    .insert({
      wedding_id: weddingId,
      user_id: userId,
      role,
      permissions: permissions || rolePermissions[role] || defaultPermissions,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WeddingMember;
}

export async function updateWeddingMember(weddingId: string, userId: string, updates: Partial<{ role: string; permissions: any }>) {
  const { data, error } = await supabase
    .from('wedding_members')
    .update(updates)
    .eq('wedding_id', weddingId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as WeddingMember;
}

export async function removeWeddingMember(weddingId: string, userId: string) {
  const { error } = await supabase
    .from('wedding_members')
    .delete()
    .eq('wedding_id', weddingId)
    .eq('user_id', userId);

  if (error) throw error;
}
