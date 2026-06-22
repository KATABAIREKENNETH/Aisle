import { useEffect, useRef } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { performanceMonitor } from '../analytics/performance';

/**
 * Hook to automatically track screen load performance
 * Call this at the top of any screen component to measure its load time
 */
export function usePerformanceTracking(screenName?: string) {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const loadStartTimeRef = useRef<number>(Date.now());
  const screenNameRef = useRef<string>(screenName || 'unknown');

  useEffect(() => {
    // Get screen name from route if not provided
    if (!screenName) {
      const routeName = navigation.getState()?.routes?.[navigation.getState()?.index || 0]?.name;
      screenNameRef.current = routeName || 'unknown';
    }

    // Start timing when component mounts
    loadStartTimeRef.current = Date.now();

    return () => {
      // Record load time when component unmounts or navigates away
      const loadTime = Date.now() - loadStartTimeRef.current;
      performanceMonitor.measureScreenLoad(screenNameRef.current, loadTime, {
        params: JSON.stringify(params),
      });
    };
  }, [navigation, params, screenName]);

  // Also record on focus change (when returning to screen)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStartTimeRef.current = Date.now();
    });

    return unsubscribe;
  }, [navigation]);
}

/**
 * Hook to track specific operations performance
 * Use this to measure custom operations within a screen
 */
export function useOperationTracking() {
  const startOperation = (operationName: string) => {
    performanceMonitor.startTiming(operationName);
  };

  const endOperation = async (
    operationName: string,
    operationType: string,
    context?: {
      screenName?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    await performanceMonitor.endTiming(operationName, operationType, context);
  };

  return { startOperation, endOperation };
}
