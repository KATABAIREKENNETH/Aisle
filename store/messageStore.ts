import { create } from 'zustand';
import type { Message, ConversationWithDetails } from '../types/message';
import { subscribeToMessageChanges, unsubscribeFromChannel } from '../lib/supabase/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MessageState {
  messages: Message[];
  conversations: ConversationWithDetails[];
  selectedConversation: string | null;
  channel: RealtimeChannel | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  setConversations: (conversations: ConversationWithDetails[]) => void;
  updateConversation: (conversationId: string, updates: Partial<ConversationWithDetails>) => void;
  setSelectedConversation: (conversationId: string | null) => void;
  subscribeToRealtime: (weddingId: string) => void;
  unsubscribeFromRealtime: () => void;
  clearStore: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  conversations: [],
  selectedConversation: null,
  channel: null,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((message) =>
      message.id === id ? { ...message, ...updates } : message
    ),
  })),
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter((message) => message.id !== id),
  })),
  setConversations: (conversations) => set({ conversations }),
  updateConversation: (conversationId, updates) => set((state) => ({
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, ...updates } : conversation
    ),
  })),
  setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
  subscribeToRealtime: (weddingId) => {
    const state = get();
    if (state.channel) {
      unsubscribeFromChannel(state.channel);
    }
    
    const channel = subscribeToMessageChanges(weddingId, (payload) => {
      if (payload.event === 'INSERT') {
        set((state) => ({ messages: [...state.messages, payload.new] }));
      } else if (payload.event === 'UPDATE') {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === payload.new.id ? payload.new : message
          ),
        }));
      } else if (payload.event === 'DELETE') {
        set((state) => ({
          messages: state.messages.filter((message) => message.id !== payload.old.id),
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
    set({ messages: [], conversations: [], selectedConversation: null, channel: null });
  },
}));
