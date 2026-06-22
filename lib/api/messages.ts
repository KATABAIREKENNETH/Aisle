import { supabase } from '../supabase/client';
import type { Message, MessageFormData, Conversation, ConversationWithDetails, ConversationParticipant, CreateConversationData } from '../../types/message';

export interface AvailableUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  type: 'guest' | 'vendor' | 'partner';
}

export async function getAvailableUsers(weddingId: string, currentUserId: string): Promise<AvailableUser[]> {
  const users: AvailableUser[] = [];

  // Get the partner from the wedding
  const { data: wedding } = await supabase
    .from('weddings')
    .select('partner_id, couple_id')
    .eq('id', weddingId)
    .single();

  if (wedding?.partner_id && wedding.partner_id !== currentUserId) {
    const { data: partner } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('id', wedding.partner_id)
      .single();

    if (partner) {
      users.push({
        id: partner.id,
        full_name: partner.full_name,
        avatar_url: partner.avatar_url,
        email: partner.email,
        type: 'partner',
      });
    }
  }

  // Get guests who have accepted invitations and have profile entries
  const { data: guests } = await supabase
    .from('guests')
    .select('id, name, email, user_id, invitation_accepted')
    .eq('wedding_id', weddingId)
    .eq('invitation_accepted', true)
    .is('user_id', 'not.null');

  if (guests) {
    for (const guest of guests) {
      if (guest.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .eq('id', guest.user_id)
          .single();

        if (profile) {
          users.push({
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            email: profile.email,
            type: 'guest',
          });
        }
      }
    }
  }

  // Get vendors who have accepted invitations and have profile entries
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, email, user_id')
    .eq('wedding_id', weddingId)
    .is('user_id', 'not.null');

  if (vendors) {
    for (const vendor of vendors) {
      if (vendor.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .eq('id', vendor.user_id)
          .single();

        if (profile) {
          users.push({
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            email: profile.email,
            type: 'vendor',
          });
        }
      }
    }
  }

  return users;
}

export async function getConversations(weddingId: string, currentUserId: string) {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversations!inner (
        id,
        wedding_id,
        name,
        is_group,
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', currentUserId)
    .eq('conversations.wedding_id', weddingId);

  if (error) throw error;

  const conversations: ConversationWithDetails[] = [];

  for (const participant of data as any[]) {
    const conversation = participant.conversations;
    
    // Get participants for this conversation
    const { data: participantsData } = await supabase
      .from('conversation_participants')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        last_read_at,
        user:profiles (
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('conversation_id', conversation.id);

    // Get last message
    const { data: lastMessageData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Count unread messages
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id)
      .gt('created_at', participant.last_read_at || '1970-01-01');

    conversations.push({
      ...conversation,
      participants: participantsData || [],
      last_message: lastMessageData,
      unread_count: count || 0,
    });
  }

  return conversations;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Message[];
}

export async function createConversation(data: CreateConversationData, currentUserId: string) {
  // Create the conversation
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      wedding_id: data.wedding_id,
      name: data.name,
      is_group: data.is_group,
      created_by: currentUserId,
    })
    .select()
    .single();

  if (conversationError) throw conversationError;

  // Add participants (including the creator)
  const participantIds = [currentUserId, ...data.participant_ids];
  const participants = participantIds.map(userId => ({
    conversation_id: conversationData.id,
    user_id: userId,
    role: userId === currentUserId ? 'admin' : 'member',
  }));

  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert(participants);

  if (participantsError) throw participantsError;

  return conversationData;
}

export async function sendMessage(messageData: MessageFormData, senderId: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      ...messageData,
    })
    .select(`
      *,
      sender:profiles (
        id,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', messageData.conversation_id);

  return data as Message;
}

export async function markConversationAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function addParticipant(conversationId: string, userId: string, role: 'admin' | 'member' = 'member') {
  const { data, error } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: role,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ConversationParticipant;
}

export async function removeParticipant(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getConversationParticipants(conversationId: string) {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      *,
      user:profiles (
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .eq('conversation_id', conversationId);

  if (error) throw error;
  return data as ConversationParticipant[];
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}
