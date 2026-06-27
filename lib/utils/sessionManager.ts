/**
 * Session Manager
 * Handles session timeout, inactivity detection, and user notifications
 */

import { signOut, getSession, isSessionValid } from '../supabase/auth';

export interface SessionManagerOptions {
  inactivityTimeout?: number; // Minutes of inactivity before timeout (default: 30)
  warningThreshold?: number; // Minutes before timeout to show warning (default: 5)
  onSessionExpiring?: (minutesRemaining: number) => void;
  onSessionExpired?: () => void;
  onActivityDetected?: () => void;
}

export class SessionManager {
  private inactivityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  public options: Required<SessionManagerOptions>;
  private isMonitoring: boolean = false;

  constructor(options: SessionManagerOptions = {}) {
    this.options = {
      inactivityTimeout: options.inactivityTimeout || 30,
      warningThreshold: options.warningThreshold || 5,
      onSessionExpiring: options.onSessionExpiring || (() => {}),
      onSessionExpired: options.onSessionExpired || (() => {}),
      onActivityDetected: options.onActivityDetected || (() => {}),
    };
  }

  /**
   * Start monitoring session activity
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastActivityTime = Date.now();
    
    // Set up activity listeners
    this.setupActivityListeners();
    
    // Start inactivity timer
    this.resetInactivityTimer();
    
    console.log('Session monitoring started');
  }

  /**
   * Stop monitoring session activity
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    this.removeActivityListeners();
    
    console.log('Session monitoring stopped');
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer() {
    if (!this.isMonitoring) return;
    
    // Clear existing timers
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    
    const timeoutMs = this.options.inactivityTimeout * 60 * 1000;
    const warningMs = (this.options.inactivityTimeout - this.options.warningThreshold) * 60 * 1000;
    
    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.options.onSessionExpiring(this.options.warningThreshold);
    }, warningMs);
    
    // Set inactivity timer
    this.inactivityTimer = setTimeout(async () => {
      const isValid = await isSessionValid();
      if (isValid) {
        console.log('Session still valid despite inactivity, continuing monitoring');
        this.resetInactivityTimer();
      } else {
        console.log('Session expired due to inactivity');
        this.handleSessionExpired();
      }
    }, timeoutMs);
  }

  /**
   * Handle session expiration
   */
  private async handleSessionExpired() {
    this.stopMonitoring();
    this.options.onSessionExpired();
    
    // Sign out user
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Record user activity
   */
  recordActivity() {
    if (!this.isMonitoring) return;
    
    this.lastActivityTime = Date.now();
    this.options.onActivityDetected();
    this.resetInactivityTimer();
  }

  /**
   * Set up activity event listeners
   */
  private setupActivityListeners() {
    if (typeof window !== 'undefined') {
      // Mouse events
      window.addEventListener('mousemove', this.recordActivity.bind(this));
      window.addEventListener('mousedown', this.recordActivity.bind(this));
      window.addEventListener('click', this.recordActivity.bind(this));
      window.addEventListener('scroll', this.recordActivity.bind(this));
      
      // Keyboard events
      window.addEventListener('keydown', this.recordActivity.bind(this));
      window.addEventListener('keypress', this.recordActivity.bind(this));
      
      // Touch events (mobile)
      window.addEventListener('touchstart', this.recordActivity.bind(this));
      window.addEventListener('touchmove', this.recordActivity.bind(this));
    }
  }

  /**
   * Remove activity event listeners
   */
  private removeActivityListeners() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.recordActivity.bind(this));
      window.removeEventListener('mousedown', this.recordActivity.bind(this));
      window.removeEventListener('click', this.recordActivity.bind(this));
      window.removeEventListener('scroll', this.recordActivity.bind(this));
      window.removeEventListener('keydown', this.recordActivity.bind(this));
      window.removeEventListener('keypress', this.recordActivity.bind(this));
      window.removeEventListener('touchstart', this.recordActivity.bind(this));
      window.removeEventListener('touchmove', this.recordActivity.bind(this));
    }
  }

  /**
   * Get time until session expires
   */
  async getTimeUntilExpiry(): Promise<number> {
    const session = await getSession();
    if (!session?.access_token) return 0;
    
    const tokenParts = session.access_token.split('.');
    if (tokenParts.length !== 3) return 0;
    
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - currentTime);
    } catch {
      return 0;
    }
  }

  /**
   * Check if session is about to expire
   */
  async isSessionExpiringSoon(thresholdMinutes: number = 5): Promise<boolean> {
    const secondsUntilExpiry = await this.getTimeUntilExpiry();
    const thresholdSeconds = thresholdMinutes * 60;
    return secondsUntilExpiry <= thresholdSeconds;
  }
}

// Singleton instance
let sessionManagerInstance: SessionManager | null = null;

/**
 * Get or create session manager instance
 */
export function getSessionManager(options?: SessionManagerOptions): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(options);
  }
  return sessionManagerInstance;
}

/**
 * Reset session manager instance (useful for testing)
 */
export function resetSessionManager() {
  if (sessionManagerInstance) {
    sessionManagerInstance.stopMonitoring();
    sessionManagerInstance = null;
  }
}
