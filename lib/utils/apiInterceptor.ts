/**
 * API Request Interceptor
 * Automatically adds JWT tokens to API requests and handles token refresh
 */

import { getSession, refreshSession } from '../supabase/auth';

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

/**
 * Enhanced fetch with automatic JWT token injection and refresh
 */
export async function apiFetch(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { skipAuth = false, retryCount = 0, ...fetchOptions } = options;
  const maxRetries = 1;

  // Add JWT token to headers if not skipping auth
  if (!skipAuth) {
    const session = await getSession();
    if (session?.access_token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${session.access_token}`,
      };
    }
  }

  let response = await fetch(url, fetchOptions);

  // Handle 401 Unauthorized - try to refresh token and retry
  if (response.status === 401 && !skipAuth && retryCount < maxRetries) {
    console.log('Received 401, attempting token refresh...');
    
    try {
      const refreshed = await refreshSession();
      if (refreshed.session?.access_token) {
        console.log('Token refreshed successfully, retrying request...');
        
        // Retry with new token
        return apiFetch(url, {
          ...fetchOptions,
          skipAuth: false,
          retryCount: retryCount + 1,
        });
      }
    } catch (refreshError) {
      console.error('Failed to refresh token:', refreshError);
      // Return original 401 response if refresh fails
    }
  }

  return response;
}

/**
 * Helper for GET requests
 */
export async function apiGet(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * Helper for POST requests
 */
export async function apiPost(url: string, data?: any, options: ApiRequestOptions = {}): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper for PUT requests
 */
export async function apiPut(url: string, data?: any, options: ApiRequestOptions = {}): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * Helper for PATCH requests
 */
export async function apiPatch(url: string, data?: any, options: ApiRequestOptions = {}): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}
