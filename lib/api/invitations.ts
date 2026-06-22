import { supabase } from '../supabase/client';

export async function sendGuestInvitation(guestId: string, email: string) {
  // Generate a unique invitation token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const { data, error } = await supabase
    .from('guests')
    .update({
      invitation_sent: true,
      invitation_token: token,
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) throw error;

  // In a real app, you would send an email here with the invitation link
  // For now, we'll just return the token
  return { token, guest: data };
}

export async function sendVendorInvitation(vendorId: string, email: string) {
  // Generate a unique invitation token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const { data, error } = await supabase
    .from('vendors')
    .update({
      invitation_sent: true,
      invitation_token: token,
    })
    .eq('id', vendorId)
    .select()
    .single();

  if (error) throw error;

  // In a real app, you would send an email here with the invitation link
  // For now, we'll just return the token
  return { token, vendor: data };
}

export async function acceptInvitation(token: string, userId: string, type: 'guest' | 'vendor') {
  const tableName = type === 'guest' ? 'guests' : 'vendors';
  
  const { data, error } = await supabase
    .from(tableName)
    .update({
      invitation_accepted: true,
      user_id: userId,
    })
    .eq('invitation_token', token)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function validateInvitation(token: string, type: 'guest' | 'vendor') {
  const tableName = type === 'guest' ? 'guests' : 'vendors';
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('invitation_token', token)
    .single();

  if (error) throw error;

  if (!data.invitation_sent) {
    throw new Error('Invitation not sent');
  }

  if (data.invitation_accepted) {
    throw new Error('Invitation already accepted');
  }

  return data;
}
