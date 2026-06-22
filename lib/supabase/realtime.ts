import { supabase } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeCallback<T> {
  (payload: {
    event: RealtimeEvent;
    new: T;
    old: T;
  }): void;
}

export function subscribeToTable<T>(
  table: string,
  filter: string,
  callback: RealtimeCallback<T>
): RealtimeChannel {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload) => callback(payload as any)
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${table} changes`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to ${table}`);
      }
    });

  return channel;
}

export function unsubscribeFromChannel(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}

export function subscribeToWeddingChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel {
  return subscribeToTable('weddings', `id=eq.${weddingId}`, callback);
}

export function subscribeToTaskChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel {
  return subscribeToTable('tasks', `wedding_id=eq.${weddingId}`, callback);
}

export function subscribeToGuestChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel {
  return subscribeToTable('guests', `wedding_id=eq.${weddingId}`, callback);
}

export function subscribeToVendorChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel {
  return subscribeToTable('vendors', `wedding_id=eq.${weddingId}`, callback);
}

export function subscribeToBudgetChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel {
  return subscribeToTable('budget_categories', `wedding_id=eq.${weddingId}`, callback);
}

export function subscribeToExpenseChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel {
  return subscribeToTable('expenses', `wedding_id=eq.${weddingId}`, callback);
}

export function subscribeToAppointmentChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel {
  return subscribeToTable('appointments', `wedding_id=eq.${weddingId}`, callback);
}

export function subscribeToMessageChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel {
  return subscribeToTable('messages', `wedding_id=eq.${weddingId}`, callback);
}

export function subscribeToAllWeddingChanges(
  weddingId: string,
  callback: RealtimeCallback<any>
): RealtimeChannel[] {
  const channels = [
    subscribeToWeddingChanges(weddingId, callback),
    subscribeToTaskChanges(weddingId, callback),
    subscribeToGuestChanges(weddingId, callback),
    subscribeToVendorChanges(weddingId, callback),
    subscribeToBudgetChanges(weddingId, callback),
    subscribeToExpenseChanges(weddingId, callback),
    subscribeToAppointmentChanges(weddingId, callback),
    subscribeToMessageChanges(weddingId, callback),
  ];

  return channels;
}

export function unsubscribeFromAllChannels(channels: RealtimeChannel[]) {
  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
}

export function subscribeToPresence(
  weddingId: string,
  onPresenceJoin: (userId: string) => void,
  onPresenceLeave: (userId: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`wedding-${weddingId}-presence`)
    .on('presence', { event: 'join' }, ({ key }) => {
      const userId = key.split(':')[1];
      onPresenceJoin(userId);
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      const userId = key.split(':')[1];
      onPresenceLeave(userId);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      }
    });

  return channel;
}
