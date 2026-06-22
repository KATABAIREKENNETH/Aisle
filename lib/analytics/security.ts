import { createSecurityEvent } from '../api/analytics';

// Log security event
export async function logSecurityEvent(
  eventType: string,
  context?: {
    userId?: string;
    eventDescription?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceInfo?: Record<string, any>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    notes?: string;
  }
) {
  try {
    await createSecurityEvent({
      user_id: context?.userId,
      event_type: eventType,
      event_description: context?.eventDescription,
      ip_address: context?.ipAddress,
      user_agent: context?.userAgent,
      location: context?.location,
      device_info: context?.deviceInfo as any,
      severity: context?.severity || 'medium',
      status: 'open',
      notes: context?.notes,
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Log failed login attempt
export async function logFailedLogin(
  email: string,
  reason: string,
  context?: { userId?: string; ipAddress?: string; userAgent?: string }
) {
  await logSecurityEvent('failed_login', {
    userId: context?.userId,
    eventDescription: `Failed login attempt for email: ${email}`,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    severity: 'medium',
    notes: reason,
  });
}

// Log successful login
export async function logSuccessfulLogin(
  userId: string,
  context?: { ipAddress?: string; userAgent?: string }
) {
  await logSecurityEvent('successful_login', {
    userId,
    eventDescription: `Successful login for user: ${userId}`,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    severity: 'low',
  });
}

// Log password reset request
export async function logPasswordReset(
  email: string,
  context?: { userId?: string; ipAddress?: string; userAgent?: string }
) {
  await logSecurityEvent('password_reset_request', {
    userId: context?.userId,
    eventDescription: `Password reset requested for email: ${email}`,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    severity: 'medium',
  });
}

// Log suspicious activity
export async function logSuspiciousActivity(
  activityType: string,
  description: string,
  context?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceInfo?: Record<string, any>;
  }
) {
  await logSecurityEvent('suspicious_activity', {
    eventDescription: description,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    location: context?.location,
    deviceInfo: context?.deviceInfo,
    severity: 'high',
    notes: activityType,
  });
}

// Log unauthorized access attempt
export async function logUnauthorizedAccess(
  resource: string,
  context?: { ipAddress?: string; userAgent?: string }
) {
  await logSecurityEvent('unauthorized_access', {
    eventDescription: `Unauthorized access attempt to: ${resource}`,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    severity: 'high',
  });
}

// Log account takeover attempt
export async function logAccountTakeoverAttempt(
  userId: string,
  context?: { ipAddress?: string; userAgent?: string }
) {
  await logSecurityEvent('account_takeover_attempt', {
    eventDescription: `Account takeover attempt for user: ${userId}`,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    severity: 'critical',
  });
}

// Resolve security event
export async function resolveSecurityEvent(
  eventId: string,
  resolvedBy: string,
  notes?: string
) {
  try {
    const { updateSecurityEvent } = await import('../api/analytics');
    await updateSecurityEvent(eventId, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      notes,
    });
  } catch (error) {
    console.error('Failed to resolve security event:', error);
  }
}
