import { create } from 'zustand';
import type { Wedding } from '../types/wedding';
import { subscribeToWeddingChanges, unsubscribeFromChannel } from '../lib/supabase/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

interface WeddingState {
  wedding: Wedding | null;
  channel: RealtimeChannel | null;
  setWedding: (wedding: Wedding | null) => void;
  updateWedding: (updates: Partial<Wedding>) => void;
  subscribeToRealtime: (weddingId: string) => void;
  unsubscribeFromRealtime: () => void;
  clearStore: () => void;
}

export const useWeddingStore = create<WeddingState>((set, get) => ({
  wedding: null,
  channel: null,
  setWedding: (wedding) => set({ wedding }),
  updateWedding: (updates) => set((state) => ({
    wedding: state.wedding ? { ...state.wedding, ...updates } : null,
  })),
  subscribeToRealtime: (weddingId) => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
    }
    
    const channel = subscribeToWeddingChanges(weddingId, (payload) => {
      if (payload.event === 'UPDATE') {
        set({ wedding: payload.new });
      }
    });
    
    set({ channel });
  },
  unsubscribeFromRealtime: () => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
      set({ channel: null });
    }
  },
  clearStore: () => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
    }
    set({ wedding: null, channel: null });
  },
}));
