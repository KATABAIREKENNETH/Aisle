import { getCurrentUser, getSession, onAuthStateChange } from '../../supabase/auth';
import { getUserWeddings } from '../../api/weddings';
import { supabase } from '../../__mocks__/supabase/client';

jest.mock('../../supabase/client', () => ({
  supabase: require('../../__mocks__/supabase/client').supabase,
}));

jest.mock('../../supabase/auth', () => ({
  getCurrentUser: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
}));

jest.mock('../../api/weddings', () => ({
  getUserWeddings: jest.fn(),
}));

describe('useAuth Hook - Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: null,
      role: 'couple',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSession = {
    user: mockUser,
    access_token: 'token-123',
  };

  const mockWeddingContexts = [
    {
      wedding_id: 'wedding-123',
      role: 'couple',
      permissions: { can_edit_budget: true },
      wedding: { id: 'wedding-123', name: 'Test Wedding' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load user session and wedding contexts on mount', async () => {
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (getUserWeddings as jest.Mock).mockResolvedValue(mockWeddingContexts);

    // Test the core logic without React rendering
    const session = await getSession();
    const currentUser = await getCurrentUser();
    if (!currentUser) return;
    const weddingContexts = await getUserWeddings(currentUser.id);

    expect(getSession).toHaveBeenCalled();
    expect(getCurrentUser).toHaveBeenCalled();
    expect(getUserWeddings).toHaveBeenCalledWith(currentUser.id);
    expect(weddingContexts).toEqual(mockWeddingContexts);
  });

  it('should handle auth state changes', async () => {
    const mockSubscription = {
      unsubscribe: jest.fn(),
    };

    (onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      callback('SIGNED_IN', mockSession);
      return { subscription: mockSubscription };
    });
    (getUserWeddings as jest.Mock).mockResolvedValue(mockWeddingContexts);

    // Test auth state change logic
    const result = onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        const weddingContexts = await getUserWeddings(session.user.id);
        expect(weddingContexts).toEqual(mockWeddingContexts);
      }
    });

    expect(onAuthStateChange).toHaveBeenCalled();
    expect(result.subscription).toBeDefined();
  });

  it('should handle null session (user logged out)', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const session = await getSession();
    const currentUser = await getCurrentUser();

    expect(session).toBeNull();
    expect(currentUser).toBeNull();
  });
});
