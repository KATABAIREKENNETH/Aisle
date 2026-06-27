/**
 * JWT Token Utilities
 * Handles JWT token decoding, validation, and expiration checking
 */

export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  exp: number; // Expiration time (Unix timestamp)
  iat: number; // Issued at (Unix timestamp)
  aud?: string; // Audience
  iss?: string; // Issuer
  role?: string;
  [key: string]: any;
}

export interface TokenInfo {
  payload: JWTPayload;
  isExpired: boolean;
  timeUntilExpiry: number; // Seconds until expiry
  isValid: boolean;
}

/**
 * Decode JWT token without verification (for client-side use)
 * Note: This doesn't verify the signature, only decodes the payload
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get time until token expires in seconds
 */
export function getTimeUntilExpiry(token: string): number {
  const payload = decodeJWT(token);
  if (!payload) return 0;

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - currentTime);
}

/**
 * Get comprehensive token information
 */
export function getTokenInfo(token: string): TokenInfo | null {
  const payload = decodeJWT(token);
  if (!payload) return null;

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = Math.max(0, payload.exp - currentTime);
  const isExpired = payload.exp < currentTime;

  return {
    payload,
    isExpired,
    timeUntilExpiry,
    isValid: !isExpired,
  };
}

/**
 * Extract user ID from JWT token
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.sub || null;
}

/**
 * Extract user email from JWT token
 */
export function getEmailFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.email || null;
}

/**
 * Check if token should be refreshed (expires within 5 minutes)
 */
export function shouldRefreshToken(token: string, bufferSeconds: number = 300): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(token);
  return timeUntilExpiry <= bufferSeconds;
}

/**
 * Validate token structure
 */
export function isValidTokenStructure(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = parts[1];
    const decoded = atob(payload);
    const parsed = JSON.parse(decoded);

    return !!(parsed.exp && parsed.sub);
  } catch {
    return false;
  }
}
