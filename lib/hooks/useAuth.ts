import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getCurrentUser, getSession, onAuthStateChange } from '../supabase/auth';
import { getUserWeddings } from '../api/weddings';

export function useAuth() {
  const { user, session, setUser, setSession, setLoading, setWeddingContexts, setCurrentWeddingId } = useAuthStore();

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const session = await getSession();
        const currentUser = await getCurrentUser();
        
        setSession(session);
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name,
            avatar_url: currentUser.user_metadata?.avatar_url,
            role: currentUser.user_metadata?.role || 'couple',
            created_at: currentUser.created_at,
            updated_at: currentUser.updated_at,
          });

          // Load user's wedding contexts
          const weddingContexts = await getUserWeddings(currentUser.id);
          const contexts = weddingContexts.map(wc => ({
            wedding_id: wc.wedding_id,
            role: wc.role,
            permissions: wc.permissions,
          }));
          setWeddingContexts(contexts);

          // Set current wedding to first one if available
          if (contexts.length > 0) {
            setCurrentWeddingId(contexts[0].wedding_id);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    const { subscription } = onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
          role: session.user.user_metadata?.role || 'couple',
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        });

        // Load user's wedding contexts
        const weddingContexts = await getUserWeddings(session.user.id);
        const contexts = weddingContexts.map(wc => ({
          wedding_id: wc.wedding_id,
          role: wc.role,
          permissions: wc.permissions,
        }));
        setWeddingContexts(contexts);

        // Set current wedding to first one if available
        if (contexts.length > 0) {
          setCurrentWeddingId(contexts[0].wedding_id);
        }
      } else {
        setUser(null);
        setWeddingContexts([]);
        setCurrentWeddingId(null);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [setUser, setSession, setLoading, setWeddingContexts, setCurrentWeddingId]);

  return { user, session };
}
