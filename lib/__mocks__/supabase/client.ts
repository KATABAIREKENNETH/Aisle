// Mock Supabase client for testing
import { jest } from '@jest/globals';

const supabaseMock: any = {
  from: jest.fn(() => supabaseMock),
  select: jest.fn(() => supabaseMock),
  insert: jest.fn(() => supabaseMock),
  update: jest.fn(() => supabaseMock),
  delete: jest.fn(() => supabaseMock),
  eq: jest.fn(() => supabaseMock),
  or: jest.fn(() => supabaseMock),
  single: jest.fn(() => supabaseMock),
  order: jest.fn(() => supabaseMock),
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
};

export const supabase = supabaseMock;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
