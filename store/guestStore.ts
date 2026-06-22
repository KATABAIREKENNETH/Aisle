import { create } from 'zustand';
import type { Guest, RSVPStatus } from '../types/guest';
import { subscribeToGuestChanges, unsubscribeFromChannel } from '../lib/supabase/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GuestState {
  guests: Guest[];
  selectedFilter: string;
  channel: RealtimeChannel | null;
  setGuests: (guests: Guest[]) => void;
  addGuest: (guest: Guest) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  setSelectedFilter: (filter: string) => void;
  updateRSVPStatus: (id: string, status: RSVPStatus) => void;
  subscribeToRealtime: (weddingId: string) => void;
  unsubscribeFromRealtime: () => void;
  clearStore: () => void;
}

export const useGuestStore = create<GuestState>((set, get) => ({
  guests: [],
  selectedFilter: 'all',
  channel: null,
  setGuests: (guests) => set({ guests }),
  addGuest: (guest) => set((state) => ({ guests: [...state.guests, guest] })),
  updateGuest: (id, updates) => set((state) => ({
    guests: state.guests.map((guest) =>
      guest.id === id ? { ...guest, ...updates } : guest
    ),
  })),
  deleteGuest: (id) => set((state) => ({
    guests: state.guests.filter((guest) => guest.id !== id),
  })),
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  updateRSVPStatus: (id, status) => set((state) => ({
    guests: state.guests.map((guest) =>
      guest.id === id ? { ...guest, rsvp_status: status } : guest
    ),
  })),
  subscribeToRealtime: (weddingId) => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
    }
    
    const channel = subscribeToGuestChanges(weddingId, (payload) => {
      if (payload.event === 'INSERT') {
        set((state) => ({ guests: [...state.guests, payload.new] }));
      } else if (payload.event === 'UPDATE') {
        set((state) => ({
          guests: state.guests.map((guest) =>
            guest.id === payload.new.id ? payload.new : guest
          ),
        }));
      } else if (payload.event === 'DELETE') {
        set((state) => ({
          guests: state.guests.filter((guest) => guest.id !== payload.old.id),
        }));
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
    set({ guests: [], selectedFilter: 'all', channel: null });
  },
}));
