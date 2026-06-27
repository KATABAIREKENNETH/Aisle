import {
  decodeJWT,
  isTokenExpired,
  getTimeUntilExpiry,
  getTokenInfo,
  getUserIdFromToken,
  getEmailFromToken,
  shouldRefreshToken,
  isValidTokenStructure,
} from '../jwt';

describe('JWT Utilities', () => {
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.4Adcj3UFYzP5qJ6YJzWHhX5vZ5Z5Z5Z5Z5Z5Z5Z5Z5Z';
  
  const invalidToken = 'invalid.token.format';

  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      const payload = decodeJWT(validToken);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('1234567890');
      expect(payload?.email).toBe('john@example.com');
    });

    it('should return null for invalid token format', () => {
      const payload = decodeJWT(invalidToken);
      expect(payload).toBeNull();
    });

    it('should return null for malformed token', () => {
      const payload = decodeJWT('not.a.jwt');
      expect(payload).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const expired = isTokenExpired(validToken);
      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      const expired = isTokenExpired(expiredToken);
      expect(expired).toBe(true);
    });

    it('should return true for invalid token', () => {
      const expired = isTokenExpired(invalidToken);
      expect(expired).toBe(true);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return positive time for valid token', () => {
      const time = getTimeUntilExpiry(validToken);
      expect(time).toBeGreaterThan(0);
    });

    it('should return 0 for expired token', () => {
      const time = getTimeUntilExpiry(expiredToken);
      expect(time).toBe(0);
    });

    it('should return 0 for invalid token', () => {
      const time = getTimeUntilExpiry(invalidToken);
      expect(time).toBe(0);
    });
  });

  describe('getTokenInfo', () => {
    it('should return comprehensive token info for valid token', () => {
      const info = getTokenInfo(validToken);
      expect(info).not.toBeNull();
      expect(info?.isValid).toBe(true);
      expect(info?.isExpired).toBe(false);
      expect(info?.timeUntilExpiry).toBeGreaterThan(0);
      expect(info?.payload.sub).toBe('1234567890');
    });

    it('should return null for invalid token', () => {
      const info = getTokenInfo(invalidToken);
      expect(info).toBeNull();
    });
  });

  describe('getUserIdFromToken', () => {
    it('should extract user ID from valid token', () => {
      const userId = getUserIdFromToken(validToken);
      expect(userId).toBe('1234567890');
    });

    it('should return null for invalid token', () => {
      const userId = getUserIdFromToken(invalidToken);
      expect(userId).toBeNull();
    });
  });

  describe('getEmailFromToken', () => {
    it('should extract email from valid token', () => {
      const email = getEmailFromToken(validToken);
      expect(email).toBe('john@example.com');
    });

    it('should return null for token without email', () => {
      const tokenWithoutEmail = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const email = getEmailFromToken(tokenWithoutEmail);
      expect(email).toBeNull();
    });

    it('should return null for invalid token', () => {
      const email = getEmailFromToken(invalidToken);
      expect(email).toBeNull();
    });
  });

  describe('shouldRefreshToken', () => {
    it('should return false for token with long expiry', () => {
      const shouldRefresh = shouldRefreshToken(validToken);
      expect(shouldRefresh).toBe(false);
    });

    it('should return true for token expiring soon (default 5 min buffer)', () => {
      const soonToExpireToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.4Adcj3UFYzP5qJ6YJzWHhX5vZ5Z5Z5Z5Z5Z5Z5Z5Z5Z';
      const shouldRefresh = shouldRefreshToken(soonToExpireToken);
      expect(shouldRefresh).toBe(true);
    });

    it('should respect custom buffer seconds', () => {
      const shouldRefresh = shouldRefreshToken(validToken, 99999999999);
      expect(shouldRefresh).toBe(true);
    });
  });

  describe('isValidTokenStructure', () => {
    it('should return true for valid token structure', () => {
      const isValid = isValidTokenStructure(validToken);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token structure', () => {
      const isValid = isValidTokenStructure(invalidToken);
      expect(isValid).toBe(false);
    });

    it('should return false for token without required fields', () => {
      const invalidPayloadToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const isValid = isValidTokenStructure(invalidPayloadToken);
      expect(isValid).toBe(false);
    });
  });
});
