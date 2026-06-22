import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useWeddingStore } from '../store/weddingStore';
import { useGuestStore } from '../store/guestStore';
import { useTaskStore } from '../store/taskStore';
import { useBudgetStore } from '../store/budgetStore';
import { useVendorStore } from '../store/vendorStore';
import { onAuthStateChange } from '../lib/supabase/auth';
import { getWeddingByUserId } from '../lib/api/weddings';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initializeAnalytics } from '../lib/analytics';
import { performanceMonitor } from '../lib/analytics/performance';
import { useAutoSync } from '../lib/hooks/useSync';

export default function RootLayout() {
  const { setSession, setUser, setLoading } = useAuthStore();
  const { wedding, setWedding } = useWeddingStore();
  const clearGuestStore = useGuestStore(state => state.clearStore);
  const clearTaskStore = useTaskStore(state => state.clearStore);
  const clearBudgetStore = useBudgetStore(state => state.clearStore);
  const clearVendorStore = useVendorStore(state => state.clearStore);
  
  // Enable offline-first sync
  useAutoSync();

  useEffect(() => {
    // Subscribe to auth state changes — this handles login, logout, and token refresh
    const { subscription } = onAuthStateChange(async (event, session) => {
      setSession(session);
      
      // Only redirect on specific auth events, not on token refresh
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          // Clear all stores to prevent data leakage between users
          clearGuestStore();
          clearTaskStore();
          clearBudgetStore();
          clearVendorStore();

          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            role: session.user.user_metadata?.role || 'couple',
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
          });

          // Check if user has a wedding setup
          const userWedding = await getWeddingByUserId(session.user.id);
          if (userWedding) {
            setWedding(userWedding);
            // Always replace to ensure clean navigation stack
            router.replace('/(tabs)');
          } else {
            // No wedding setup - redirect to mandatory onboarding
            router.replace('/(auth)/onboarding');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setWedding(null);
        // Clear all stores on logout
        clearGuestStore();
        clearTaskStore();
        clearBudgetStore();
        clearVendorStore();
        router.replace('/(auth)/welcome');
      }
      
      setLoading(false);
    });

    initializeAnalytics();

    // Track app initialization performance
    performanceMonitor.startTiming('app_initialization');

    return () => {
      subscription.unsubscribe();
      performanceMonitor.endTiming('app_initialization', 'app_load', {
        screenName: 'root_layout',
      });
    };
  }, [setSession, setUser, setLoading]);

  useEffect(() => {
    const handleIncomingURL = ({ url }: { url: string }) => {
      if (url.includes('rsvp/')) {
        // Handle RSVP deep link
        const weddingId = url.split('rsvp/')[1]?.split('?')[0];
        if (weddingId) {
          // Navigate to RSVP screen or web fallback
          console.log('RSVP link opened for wedding:', weddingId);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleIncomingURL);

    // Handle initial URL if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleIncomingURL({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="auto" />
        <Stack 
          screenOptions={{ headerShown: false }}
          screenListeners={{
            // Handle deep linking
          }}
          initialRouteName="(auth)"
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="rsvp/[id]" 
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="add-task" 
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="add-expense" 
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="add-guest" 
            options={{ 
              headerShown: false,
              presentation: 'modal',
            }}
          />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
