import { formatDate, getDaysUntil, isToday, isPast, isFuture } from '../date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date strings', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
      expect(formatDate('2024-12-31')).toBe('Dec 31, 2024');
    });

    it('should format Date objects', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('should support custom format strings', () => {
      expect(formatDate('2024-01-15', 'yyyy-MM-dd')).toBe('2024-01-15');
    });
  });

  describe('getDaysUntil', () => {
    it('should calculate days until a future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      expect(getDaysUntil(futureDate)).toBe(10);
    });

    it('should return negative for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      expect(getDaysUntil(pastDate)).toBe(-5);
    });

    it('should handle date strings', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const daysUntil = getDaysUntil(futureDate.toISOString());
      expect(daysUntil).toBeGreaterThanOrEqual(9);
      expect(daysUntil).toBeLessThanOrEqual(10);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for other dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isPast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isPast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isPast(futureDate)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isFuture(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isFuture(pastDate)).toBe(false);
    });
  });
});
