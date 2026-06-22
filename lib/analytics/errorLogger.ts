import { getCurrentUser } from '../supabase/auth';
import { createErrorLog } from '../api/analytics';

// Log error to database
export async function logError(
  error: Error | string,
  context?: {
    screenName?: string;
    actionType?: string;
    stackTrace?: string;
    metadata?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
  }
) {
  try {
    const user = await getCurrentUser();
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'string' ? undefined : error.stack;

    await createErrorLog({
      user_id: user?.id,
      error_type: typeof error === 'string' ? 'string_error' : error.constructor.name,
      error_message: errorMessage,
      stack_trace: stackTrace || context?.stackTrace,
      screen_name: context?.screenName,
      action_type: context?.actionType,
      severity: context?.severity || 'error',
      resolved: false,
      device_info: context?.metadata as any,
    });
  } catch (loggingError) {
    // If logging fails, at least log to console
    console.error('Failed to log error to database:', loggingError);
    console.error('Original error:', error);
  }
}

// Log info message
export async function logInfo(message: string, context?: Record<string, any>) {
  await logError(message, {
    ...context,
    severity: 'info',
  });
}

// Log warning
export async function logWarning(message: string, context?: Record<string, any>) {
  await logError(message, {
    ...context,
    severity: 'warning',
  });
}

// Log critical error
export async function logCritical(error: Error | string, context?: Record<string, any>) {
  await logError(error, {
    ...context,
    severity: 'critical',
  });
}

// Wrap async function with error logging
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: { screenName?: string; actionType?: string }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await logError(error as Error, context);
      throw error;
    }
  }) as T;
}

// Error boundary component hook
export function useErrorLogger() {
  const handleError = async (error: Error, errorInfo?: { componentStack?: string }) => {
    await logError(error, {
      screenName: 'error_boundary',
      actionType: 'component_error',
      stackTrace: errorInfo?.componentStack,
      severity: 'critical',
      metadata: { componentStack: errorInfo?.componentStack },
    });
  };

  return { handleError };
}
