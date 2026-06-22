import { create } from 'zustand';
import type { Vendor, VendorStatus } from '../types/vendor';
import { subscribeToVendorChanges, unsubscribeFromChannel } from '../lib/supabase/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

interface VendorState {
  vendors: Vendor[];
  selectedFilter: string;
  channel: RealtimeChannel | null;
  setVendors: (vendors: Vendor[]) => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  setSelectedFilter: (filter: string) => void;
  updateVendorStatus: (id: string, status: VendorStatus) => void;
  subscribeToRealtime: (weddingId: string) => void;
  unsubscribeFromRealtime: () => void;
  clearStore: () => void;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  selectedFilter: 'all',
  channel: null,
  setVendors: (vendors) => set({ vendors }),
  addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, vendor] })),
  updateVendor: (id, updates) => set((state) => ({
    vendors: state.vendors.map((vendor) =>
      vendor.id === id ? { ...vendor, ...updates } : vendor
    ),
  })),
  deleteVendor: (id) => set((state) => ({
    vendors: state.vendors.filter((vendor) => vendor.id !== id),
  })),
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  updateVendorStatus: (id, status) => set((state) => ({
    vendors: state.vendors.map((vendor) =>
      vendor.id === id ? { ...vendor, status } : vendor
    ),
  })),
  subscribeToRealtime: (weddingId) => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
    }
    
    const channel = subscribeToVendorChanges(weddingId, (payload) => {
      if (payload.event === 'INSERT') {
        set((state) => ({ vendors: [...state.vendors, payload.new] }));
      } else if (payload.event === 'UPDATE') {
        set((state) => ({
          vendors: state.vendors.map((vendor) =>
            vendor.id === payload.new.id ? payload.new : vendor
          ),
        }));
      } else if (payload.event === 'DELETE') {
        set((state) => ({
          vendors: state.vendors.filter((vendor) => vendor.id !== payload.old.id),
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
    set({ vendors: [], selectedFilter: 'all', channel: null });
  },
}));
