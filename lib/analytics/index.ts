// Main analytics entry point
export * from './tracker';
export * from './errorLogger';
export * from './performance';
export * from './security';
export * from './revenue';

// Initialize analytics on app startup
export async function initializeAnalytics() {
  try {
    const { initAnalytics } = await import('./tracker');
    await initAnalytics();
    console.log('Analytics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}
