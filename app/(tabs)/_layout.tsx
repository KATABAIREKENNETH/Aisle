import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useWeddingStore } from '../../store/weddingStore';
import { useTaskStore } from '../../store/taskStore';
import { useGuestStore } from '../../store/guestStore';
import { useBudgetStore } from '../../store/budgetStore';
import { useMessageStore } from '../../store/messageStore';
import { getWeddingByUserId } from '../../lib/api/weddings';
import { getTasks } from '../../lib/api/tasks';
import { getGuests } from '../../lib/api/guests';
import { getExpenses } from '../../lib/api/budget';
import { getConversations } from '../../lib/api/messages';
import { theme as appTheme } from '../../config/theme';
import { performanceMonitor } from '../../lib/analytics/performance';
import { useAutoSync } from '../../lib/hooks/useSync';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);
  
  // Enable offline-first sync
  useAutoSync();
  
  const { user } = useAuthStore();
  const { wedding, setWedding, subscribeToRealtime: subWedding, unsubscribeFromRealtime: unsubWedding } = useWeddingStore();
  const { setTasks, subscribeToRealtime: subTasks, unsubscribeFromRealtime: unsubTasks } = useTaskStore();
  const { setGuests, subscribeToRealtime: subGuests, unsubscribeFromRealtime: unsubGuests } = useGuestStore();
  const { setExpenses, subscribeToRealtime: subExpenses, unsubscribeFromRealtime: unsubExpenses } = useBudgetStore();
  const { setConversations, subscribeToRealtime: subMessages, unsubscribeFromRealtime: unsubMessages } = useMessageStore();

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      performanceMonitor.startTiming('tabs_data_load');
      
      try {
        const weddingData = await getWeddingByUserId(user.id);
        if (weddingData) {
          setWedding(weddingData);
          
          const [tasksData, guestsData, expensesData, conversationsData] = await Promise.all([
            getTasks(weddingData.id),
            getGuests(weddingData.id),
            getExpenses(weddingData.id),
            getConversations(weddingData.id, user.id),
          ]);
          
          setTasks(tasksData);
          setGuests(guestsData);
          setExpenses(expensesData);
          setConversations(conversationsData);

          // Subscribe to real-time updates
          subWedding(weddingData.id);
          subTasks(weddingData.id);
          subGuests(weddingData.id);
          subExpenses(weddingData.id);
          subMessages(weddingData.id);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        await performanceMonitor.endTiming('tabs_data_load', 'data_load', {
          screenName: 'tabs_layout',
        });
      }
    }
    
    loadData();

    return () => {
      unsubWedding();
      unsubTasks();
      unsubGuests();
      unsubExpenses();
      unsubMessages();
    };
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: appTheme.text,
        tabBarInactiveTintColor: appTheme.textDisabled,
        tabBarStyle: {
          backgroundColor: appTheme.background,
          borderTopWidth: 1,
          borderTopColor: appTheme.colors.border.default,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          paddingBottom: 5,
        },
        // Prevent back navigation to auth screens
        gestureEnabled: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: 'Guests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="vendors" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      {/* Hide implicit tabs from other files in the directory */}
      <Tabs.Screen name="budget-category" options={{ href: null }} />
      <Tabs.Screen name="expense-detail" options={{ href: null }} />
      <Tabs.Screen name="dayof" options={{ href: null }} />
      <Tabs.Screen name="guest-detail" options={{ href: null }} />
      <Tabs.Screen name="invite-builder" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="photos" options={{ href: null }} />
      <Tabs.Screen name="rsvp-links" options={{ href: null }} />
      <Tabs.Screen name="seating" options={{ href: null }} />
      <Tabs.Screen name="task-detail" options={{ href: null }} />
      <Tabs.Screen name="vendor-detail" options={{ href: null }} />
    </Tabs>
  );
}
