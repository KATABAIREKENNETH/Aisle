import { supabase } from '../supabase/client';
import { getCurrentUser } from '../supabase/auth';

export type ActionCategory = 
  | 'auth' 
  | 'user_management' 
  | 'wedding_management' 
  | 'task_management' 
  | 'budget_management' 
  | 'guest_management' 
  | 'vendor_management' 
  | 'rsvp_management' 
  | 'general';

export type Severity = 'info' | 'warning' | 'error' | 'critical';

export interface ActivityLogOptions {
  wedding_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  action_category?: ActionCategory;
  severity?: Severity;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
}

export async function logActivity(options: ActivityLogOptions) {
  try {
    const user = await getCurrentUser();
    
    const { error } = await supabase.from('activity_log').insert({
      user_id: user?.id,
      wedding_id: options.wedding_id,
      action: options.action,
      entity_type: options.entity_type,
      entity_id: options.entity_id,
      details: options.details,
      action_category: options.action_category || 'general',
      severity: options.severity || 'info',
      ip_address: options.ip_address,
      user_agent: options.user_agent,
      device_type: options.device_type,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Convenience functions for common activity types
export async function logAuthActivity(action: string, details?: Record<string, any>) {
  await logActivity({
    action,
    action_category: 'auth',
    details,
  });
}

export async function logUserManagementActivity(
  action: string, 
  entity_id?: string, 
  details?: Record<string, any>
) {
  await logActivity({
    action,
    entity_type: 'user',
    entity_id,
    action_category: 'user_management',
    details,
  });
}

export async function logWeddingActivity(
  action: string,
  wedding_id: string,
  details?: Record<string, any>
) {
  await logActivity({
    action,
    wedding_id,
    entity_type: 'wedding',
    entity_id: wedding_id,
    action_category: 'wedding_management',
    details,
  });
}

export async function logTaskActivity(
  action: string,
  task_id: string,
  wedding_id?: string,
  details?: Record<string, any>
) {
  await logActivity({
    action,
    wedding_id,
    entity_type: 'task',
    entity_id: task_id,
    action_category: 'task_management',
    details,
  });
}

export async function logBudgetActivity(
  action: string,
  wedding_id: string,
  details?: Record<string, any>
) {
  await logActivity({
    action,
    wedding_id,
    entity_type: 'budget',
    action_category: 'budget_management',
    details,
  });
}

export async function logGuestActivity(
  action: string,
  guest_id: string,
  wedding_id?: string,
  details?: Record<string, any>
) {
  await logActivity({
    action,
    wedding_id,
    entity_type: 'guest',
    entity_id: guest_id,
    action_category: 'guest_management',
    details,
  });
}

export async function logVendorActivity(
  action: string,
  vendor_id: string,
  wedding_id?: string,
  details?: Record<string, any>
) {
  await logActivity({
    action,
    wedding_id,
    entity_type: 'vendor',
    entity_id: vendor_id,
    action_category: 'vendor_management',
    details,
  });
}

export async function logRSVPActivity(
  action: string,
  guest_id: string,
  wedding_id?: string,
  details?: Record<string, any>
) {
  await logActivity({
    action,
    wedding_id,
    entity_type: 'rsvp',
    entity_id: guest_id,
    action_category: 'rsvp_management',
    details,
  });
}

export async function logSecurityEvent(
  action: string,
  severity: Severity = 'warning',
  details?: Record<string, any>
) {
  await logActivity({
    action,
    action_category: 'auth',
    severity,
    details,
  });
}
