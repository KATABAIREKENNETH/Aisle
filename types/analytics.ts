export interface AppAnalytics {
  id: string;
  user_id?: string;
  session_id?: string;
  screen_name: string;
  feature_used?: string;
  action_type?: string;
  duration_seconds?: number;
  timestamp: string;
  device_info?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ConversionFunnel {
  id: string;
  user_id?: string;
  step: string;
  step_name: string;
  completed: boolean;
  completed_at?: string;
  time_to_complete_seconds?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface RetentionMetrics {
  id: string;
  user_id?: string;
  cohort_date: string;
  activity_date: string;
  days_active: number;
  sessions_count: number;
  features_used: string[];
  last_active_at: string;
  created_at: string;
}

export interface RevenueTracking {
  id: string;
  user_id?: string;
  wedding_id?: string;
  subscription_type?: string;
  amount: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_fee?: number;
  net_amount?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface MarketInsights {
  id: string;
  region?: string;
  country?: string;
  city?: string;
  metric_type: string;
  metric_name: string;
  metric_value?: number;
  count?: number;
  average_budget?: number;
  popular_vendor_categories?: string[];
  data_period_start?: string;
  data_period_end?: string;
  calculated_at: string;
  metadata?: Record<string, any>;
}

export interface SeasonalTrends {
  id: string;
  year: number;
  month: number;
  season?: string;
  wedding_count: number;
  average_budget?: number;
  popular_venues?: string[];
  popular_vendor_categories?: string[];
  average_guest_count?: number;
  booking_lead_time_days?: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  user_id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  screen_name?: string;
  action_type?: string;
  device_info?: Record<string, any>;
  app_version?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_type: string;
  value?: number;
  unit?: string;
  screen_name?: string;
  endpoint?: string;
  load_time_ms?: number;
  response_time_ms?: number;
  memory_usage_mb?: number;
  device_info?: Record<string, any>;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: string;
  event_description?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  device_info?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
  created_at: string;
}
