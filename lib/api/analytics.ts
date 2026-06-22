import { supabase } from '../supabase/client';
import type {
  AppAnalytics,
  ConversionFunnel,
  RetentionMetrics,
  RevenueTracking,
  MarketInsights,
  SeasonalTrends,
  ErrorLog,
  PerformanceMetric,
  SecurityEvent,
} from '../../types/analytics';

// App Analytics
export async function getAppAnalytics(filters?: {
  userId?: string;
  screenName?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase.from('app_analytics').select('*');

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.screenName) {
    query = query.eq('screen_name', filters.screenName);
  }
  if (filters?.startDate) {
    query = query.gte('timestamp', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('timestamp', filters.endDate);
  }

  const { data, error } = await query.order('timestamp', { ascending: false });
  if (error) throw error;
  return data as AppAnalytics[];
}

export async function createAppAnalytics(analytics: Omit<AppAnalytics, 'id' | 'timestamp'>) {
  const { data, error } = await supabase.from('app_analytics').insert(analytics).select().single();
  if (error) throw error;
  return data as AppAnalytics;
}

// Conversion Funnel
export async function getConversionFunnel(filters?: {
  userId?: string;
  step?: string;
}) {
  let query = supabase.from('conversion_funnel').select('*');

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.step) {
    query = query.eq('step', filters.step);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as ConversionFunnel[];
}

export async function createConversionFunnelEntry(entry: Omit<ConversionFunnel, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('conversion_funnel').insert(entry).select().single();
  if (error) throw error;
  return data as ConversionFunnel;
}

export async function updateConversionFunnelEntry(id: string, updates: Partial<ConversionFunnel>) {
  const { data, error } = await supabase.from('conversion_funnel').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as ConversionFunnel;
}

// Retention Metrics
export async function getRetentionMetrics(filters?: {
  userId?: string;
  cohortDate?: string;
  activityDate?: string;
}) {
  let query = supabase.from('retention_metrics').select('*');

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.cohortDate) {
    query = query.eq('cohort_date', filters.cohortDate);
  }
  if (filters?.activityDate) {
    query = query.eq('activity_date', filters.activityDate);
  }

  const { data, error } = await query.order('activity_date', { ascending: false });
  if (error) throw error;
  return data as RetentionMetrics[];
}

export async function createRetentionMetrics(metrics: Omit<RetentionMetrics, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('retention_metrics').insert(metrics).select().single();
  if (error) throw error;
  return data as RetentionMetrics;
}

// Revenue Tracking
export async function getRevenueTracking(filters?: {
  userId?: string;
  weddingId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase.from('revenue_tracking').select('*');

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.weddingId) {
    query = query.eq('wedding_id', filters.weddingId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as RevenueTracking[];
}

export async function createRevenueTracking(revenue: Omit<RevenueTracking, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('revenue_tracking').insert(revenue).select().single();
  if (error) throw error;
  return data as RevenueTracking;
}

export async function updateRevenueTracking(id: string, updates: Partial<RevenueTracking>) {
  const { data, error } = await supabase.from('revenue_tracking').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as RevenueTracking;
}

// Market Insights
export async function getMarketInsights(filters?: {
  region?: string;
  metricType?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase.from('market_insights').select('*');

  if (filters?.region) {
    query = query.eq('region', filters.region);
  }
  if (filters?.metricType) {
    query = query.eq('metric_type', filters.metricType);
  }
  if (filters?.startDate) {
    query = query.gte('calculated_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('calculated_at', filters.endDate);
  }

  const { data, error } = await query.order('calculated_at', { ascending: false });
  if (error) throw error;
  return data as MarketInsights[];
}

export async function createMarketInsights(insights: Omit<MarketInsights, 'id' | 'calculated_at'>) {
  const { data, error } = await supabase.from('market_insights').insert(insights).select().single();
  if (error) throw error;
  return data as MarketInsights;
}

// Seasonal Trends
export async function getSeasonalTrends(filters?: {
  year?: number;
  month?: number;
  season?: string;
}) {
  let query = supabase.from('seasonal_trends').select('*');

  if (filters?.year) {
    query = query.eq('year', filters.year);
  }
  if (filters?.month) {
    query = query.eq('month', filters.month);
  }
  if (filters?.season) {
    query = query.eq('season', filters.season);
  }

  const { data, error } = await query.order('year', { ascending: false }).order('month', { ascending: false });
  if (error) throw error;
  return data as SeasonalTrends[];
}

export async function createSeasonalTrends(trends: Omit<SeasonalTrends, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('seasonal_trends').insert(trends).select().single();
  if (error) throw error;
  return data as SeasonalTrends;
}

// Error Logs
export async function getErrorLogs(filters?: {
  userId?: string;
  severity?: string;
  resolved?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase.from('error_logs').select('*');

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.resolved !== undefined) {
    query = query.eq('resolved', filters.resolved);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as ErrorLog[];
}

export async function createErrorLog(errorLog: Omit<ErrorLog, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('error_logs').insert(errorLog).select().single();
  if (error) throw error;
  return data as ErrorLog;
}

export async function updateErrorLog(id: string, updates: Partial<ErrorLog>) {
  const { data, error } = await supabase.from('error_logs').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as ErrorLog;
}

// Performance Metrics
export async function getPerformanceMetrics(filters?: {
  metricName?: string;
  metricType?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase.from('performance_metrics').select('*');

  if (filters?.metricName) {
    query = query.eq('metric_name', filters.metricName);
  }
  if (filters?.metricType) {
    query = query.eq('metric_type', filters.metricType);
  }
  if (filters?.startDate) {
    query = query.gte('timestamp', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('timestamp', filters.endDate);
  }

  const { data, error } = await query.order('timestamp', { ascending: false });
  if (error) throw error;
  return data as PerformanceMetric[];
}

export async function createPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
  const { data, error } = await supabase.from('performance_metrics').insert(metric).select().single();
  if (error) throw error;
  return data as PerformanceMetric;
}

// Security Events
export async function getSecurityEvents(filters?: {
  userId?: string;
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase.from('security_events').select('*');

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as SecurityEvent[];
}

export async function createSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>) {
  const { error } = await supabase.from('security_events').insert(event);
  if (error) throw error;
  return null as any; // Return value is not used by logSecurityEvent
}

export async function updateSecurityEvent(id: string, updates: Partial<SecurityEvent>) {
  const { data, error } = await supabase.from('security_events').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as SecurityEvent;
}
