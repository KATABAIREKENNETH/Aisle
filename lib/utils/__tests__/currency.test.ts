import { formatCurrency, parseCurrency } from '../currency';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format numbers as currency', () => {
      expect(formatCurrency(1000)).toContain('1,000');
      expect(formatCurrency(1000.50)).toContain('1,001');
      expect(formatCurrency(0)).toContain('0');
    });

    it('should handle string inputs', () => {
      expect(formatCurrency('1000')).toContain('1,000');
      expect(formatCurrency('1000.50')).toContain('1,001');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrency(null)).toContain('0');
      expect(formatCurrency(undefined)).toContain('0');
    });

    it('should handle invalid numbers', () => {
      expect(formatCurrency(NaN)).toContain('0');
      expect(formatCurrency('invalid')).toContain('0');
    });

    it('should support different currencies', () => {
      expect(formatCurrency(1000, 'USD')).toContain('$1,000');
      expect(formatCurrency(1000, 'EUR')).toContain('€1,000');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency strings to numbers', () => {
      expect(parseCurrency('UGX 1,000')).toBe(1000);
      expect(parseCurrency('$1,000.50')).toBe(1000.5);
      expect(parseCurrency('1,000')).toBe(1000);
    });

    it('should handle empty strings', () => {
      expect(parseCurrency('')).toBe(0);
    });

    it('should handle invalid strings', () => {
      expect(parseCurrency('invalid')).toBe(0);
    });
  });
});
