/**
 * Session Notifier
 * Provides user-friendly notifications for session events
 */

import { getSessionManager } from './sessionManager';

export interface NotificationOptions {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number; // milliseconds
  action?: {
    label: string;
    onPress: () => void;
  };
}

export class SessionNotifier {
  private sessionManager = getSessionManager();

  /**
   * Initialize session notifications
   */
  initialize() {
    this.sessionManager.options.onSessionExpiring = (minutesRemaining) => {
      this.showSessionExpiringWarning(minutesRemaining);
    };

    this.sessionManager.options.onSessionExpired = () => {
      this.showSessionExpiredNotification();
    };
  }

  /**
   * Show warning when session is about to expire
   */
  private showSessionExpiringWarning(minutesRemaining: number) {
    this.notify({
      title: 'Session Expiring Soon',
      message: `Your session will expire in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}. Please save your work.`,
      type: 'warning',
      duration: 10000,
      action: {
        label: 'Continue Session',
        onPress: () => {
          this.sessionManager.recordActivity();
          this.notify({
            title: 'Session Extended',
            message: 'Your session has been extended.',
            type: 'success',
            duration: 3000,
          });
        },
      },
    });
  }

  /**
   * Show notification when session has expired
   */
  private showSessionExpiredNotification() {
    this.notify({
      title: 'Session Expired',
      message: 'Your session has expired due to inactivity. Please sign in again.',
      type: 'error',
      duration: 0, // Persistent until dismissed
      action: {
        label: 'Sign In',
        onPress: () => {
          // Navigate to sign in screen
          // This would typically use your navigation library
          console.log('Navigate to sign in');
        },
      },
    });
  }

  /**
   * Show notification for token refresh failure
   */
  showTokenRefreshError() {
    this.notify({
      title: 'Session Error',
      message: 'Failed to refresh your session. Please sign in again.',
      type: 'error',
      duration: 0,
      action: {
        label: 'Sign In',
        onPress: () => {
          console.log('Navigate to sign in');
        },
      },
    });
  }

  /**
   * Show notification for successful token refresh
   */
  showTokenRefreshSuccess() {
    this.notify({
      title: 'Session Refreshed',
      message: 'Your session has been refreshed successfully.',
      type: 'success',
      duration: 3000,
    });
  }

  /**
   * Core notification method
   * Override this to integrate with your notification system
   */
  private notify(options: NotificationOptions) {
    console.log('[Session Notification]', options);
    
    // Integration with React Native Alert
    if (Alert) {
      Alert.alert(
        options.title,
        options.message,
        options.action ? [
          {
            text: options.action.label,
            onPress: options.action.onPress,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ] : undefined
      );
    }
    
    // Integration with React Native Toast
    // if (typeof Toast !== 'undefined') {
    //   Toast.show({
    //     type: options.type || 'info',
    //     text1: options.title,
    //     text2: options.message,
    //   });
    // }
    
    // Integration with React Native Notification
    // if (typeof Notifications !== 'undefined') {
    //   Notifications.postLocalNotification({
    //     title: options.title,
    //     body: options.message,
    //   });
    // }
  }
}

// Singleton instance
let sessionNotifierInstance: SessionNotifier | null = null;

/**
 * Get or create session notifier instance
 */
export function getSessionNotifier(): SessionNotifier {
  if (!sessionNotifierInstance) {
    sessionNotifierInstance = new SessionNotifier();
  }
  return sessionNotifierInstance;
}

/**
 * Initialize session notifications with default settings
 */
export function initializeSessionNotifications() {
  const notifier = getSessionNotifier();
  const manager = getSessionManager({
    inactivityTimeout: 30, // 30 minutes
    warningThreshold: 5, // 5 minutes warning
  });
  
  notifier.initialize();
  manager.startMonitoring();
  
  console.log('Session notifications initialized');
}
