import { create } from 'zustand';
import type { User, UserWeddingContext } from '../types';
import { signOut } from '../lib/supabase/auth';

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  weddingContexts: UserWeddingContext[];
  currentWeddingId: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  setWeddingContexts: (contexts: UserWeddingContext[]) => void;
  setCurrentWeddingId: (weddingId: string | null) => void;
  getCurrentWeddingContext: () => UserWeddingContext | null;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  weddingContexts: [],
  currentWeddingId: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setWeddingContexts: (contexts) => set({ weddingContexts: contexts }),
  setCurrentWeddingId: (weddingId) => set({ currentWeddingId: weddingId }),
  getCurrentWeddingContext: () => {
    const { weddingContexts, currentWeddingId } = get();
    if (!currentWeddingId) return null;
    return weddingContexts.find(ctx => ctx.wedding_id === currentWeddingId) || null;
  },
  hasPermission: (permission) => {
    const context = get().getCurrentWeddingContext();
    if (!context) return false;
    return context.permissions[permission as keyof typeof context.permissions] === true;
  },
  logout: async () => {
    try {
      await signOut();
      set({ user: null, session: null, weddingContexts: [], currentWeddingId: null });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if Supabase signOut fails
      set({ user: null, session: null, weddingContexts: [], currentWeddingId: null });
    }
  },
}));
