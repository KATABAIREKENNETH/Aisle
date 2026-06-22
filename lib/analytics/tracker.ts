import { getCurrentUser } from '../supabase/auth';
import { createAppAnalytics, createConversionFunnelEntry } from '../api/analytics';

let sessionId: string | null = null;
let screenStartTime: number | null = null;
let currentScreen: string | null = null;

// Generate a unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get device information
async function getDeviceInfo() {
  // Basic device info without expo-device dependency
  return {
    platform: 'react-native',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };
}

// Initialize analytics session
export async function initAnalytics() {
  sessionId = generateSessionId();
  screenStartTime = Date.now();
}

// Track screen view
export async function trackScreenView(screenName: string, metadata?: Record<string, any>) {
  try {
    const user = await getCurrentUser();
    const deviceInfo = await getDeviceInfo();

    // Calculate duration of previous screen
    let duration = 0;
    if (screenStartTime && currentScreen) {
      duration = Math.floor((Date.now() - screenStartTime) / 1000);
    }

    // Log the screen view
    await createAppAnalytics({
      user_id: user?.id,
      session_id: sessionId || undefined,
      screen_name: screenName,
      action_type: 'screen_view',
      duration_seconds: duration || undefined,
      device_info: deviceInfo as any,
      metadata,
    });

    // Update current screen tracking
    currentScreen = screenName;
    screenStartTime = Date.now();
  } catch (error) {
    console.error('Failed to track screen view:', error);
  }
}

// Track feature usage
export async function trackFeatureUsage(featureName: string, actionType: string, metadata?: Record<string, any>) {
  try {
    const user = await getCurrentUser();
    const deviceInfo = await getDeviceInfo();

    await createAppAnalytics({
      user_id: user?.id,
      session_id: sessionId || undefined,
      screen_name: currentScreen || 'unknown',
      feature_used: featureName,
      action_type: actionType,
      device_info: deviceInfo as any,
      metadata,
    });
  } catch (error) {
    console.error('Failed to track feature usage:', error);
  }
}

// Track button click
export async function trackButtonClick(buttonName: string, metadata?: Record<string, any>) {
  await trackFeatureUsage(buttonName, 'button_click', metadata);
}

// Track form submission
export async function trackFormSubmission(formName: string, metadata?: Record<string, any>) {
  await trackFeatureUsage(formName, 'form_submit', metadata);
}

// Track conversion funnel step
export async function trackConversionStep(step: string, stepName: string, completed: boolean = false, metadata?: Record<string, any>) {
  try {
    const user = await getCurrentUser();

    // Get previous step to calculate time to complete
    const timeToComplete = completed ? Math.floor((Date.now() - (screenStartTime || Date.now())) / 1000) : undefined;

    await createConversionFunnelEntry({
      user_id: user?.id,
      step,
      step_name: stepName,
      completed,
      completed_at: completed ? new Date().toISOString() : undefined,
      time_to_complete_seconds: timeToComplete,
      metadata,
    });
  } catch (error) {
    console.error('Failed to track conversion step:', error);
  }
}

// End analytics session (call on app close/background)
export async function endAnalyticsSession() {
  try {
    if (screenStartTime && currentScreen) {
      const duration = Math.floor((Date.now() - screenStartTime) / 1000);
      const user = await getCurrentUser();
      const deviceInfo = await getDeviceInfo();

      await createAppAnalytics({
        user_id: user?.id,
        session_id: sessionId || undefined,
        screen_name: currentScreen,
        action_type: 'session_end',
        duration_seconds: duration,
        device_info: deviceInfo as any,
        metadata: { session_end: true },
      });
    }
  } catch (error) {
    console.error('Failed to end analytics session:', error);
  }
}
