import { parseDateRange, generateKlaviyoDateFilter, calculatePercentageChange, getPreviousPeriodDateRange } from './dateUtils';

describe('Date Utilities', () => {
  // Save original implementation
  const originalNow = Date.now;
  
  beforeAll(() => {
    // Mock current date to 2023-05-15T12:00:00Z
    const mockTimestamp = new Date('2023-05-15T12:00:00Z').getTime();
    Date.now = jest.fn(() => mockTimestamp);
  });
  
  afterAll(() => {
    // Restore original implementation
    Date.now = originalNow;
  });
  
  describe('parseDateRange', () => {
    it('should parse last-30-days correctly', () => {
      const result = parseDateRange('last-30-days');
      
      // Expected: 30 days before mock date at start of day to mock date at end of day
      expect(result.start).toMatch(/^2023-04-15T00:00:00/);
      expect(result.end).toMatch(/^2023-05-15T23:59:59/);
    });
    
    it('should parse last-7-days correctly', () => {
      const result = parseDateRange('last-7-days');
      
      // Expected: 7 days before mock date at start of day to mock date at end of day
      expect(result.start).toMatch(/^2023-05-08T00:00:00/);
      expect(result.end).toMatch(/^2023-05-15T23:59:59/);
    });
    
    it('should parse custom date range correctly', () => {
      const result = parseDateRange('2023-01-01_to_2023-02-01');
      
      expect(result.start).toMatch(/^2023-01-01T00:00:00/);
      expect(result.end).toMatch(/^2023-02-01T23:59:59/);
    });
    
    it('should default to last-30-days if no range is provided', () => {
      const result = parseDateRange();
      
      expect(result.start).toMatch(/^2023-04-15T00:00:00/);
      expect(result.end).toMatch(/^2023-05-15T23:59:59/);
    });
    
    it('should default to last-30-days if an invalid format is provided', () => {
      const result = parseDateRange('invalid-format');
      
      expect(result.start).toMatch(/^2023-04-15T00:00:00/);
      expect(result.end).toMatch(/^2023-05-15T23:59:59/);
    });
  });
  
  describe('generateKlaviyoDateFilter', () => {
    it('should generate a valid Klaviyo filter string', () => {
      const dateRange = {
        start: '2023-01-01T00:00:00.000Z',
        end: '2023-01-31T23:59:59.999Z'
      };
      
      const result = generateKlaviyoDateFilter('created', dateRange);
      
      expect(result).toBe("greater-or-equal(created,'2023-01-01T00:00:00.000Z'),less-or-equal(created,'2023-01-31T23:59:59.999Z')");
    });
  });
  
  describe('calculatePercentageChange', () => {
    it('should calculate positive percentage change', () => {
      const result = calculatePercentageChange(110, 100);
      expect(result).toBe('+10.0%');
    });
    
    it('should calculate negative percentage change', () => {
      const result = calculatePercentageChange(90, 100);
      expect(result).toBe('-10.0%');
    });
    
    it('should handle zero previous value', () => {
      const resultPositive = calculatePercentageChange(10, 0);
      const resultZero = calculatePercentageChange(0, 0);
      
      expect(resultPositive).toBe('+∞%');
      expect(resultZero).toBe('0%');
    });
  });
  
  describe('getPreviousPeriodDateRange', () => {
    it('should calculate the previous period correctly', () => {
      const currentRange = {
        start: '2023-05-01T00:00:00.000Z',
        end: '2023-05-31T23:59:59.999Z'
      };
      
      const result = getPreviousPeriodDateRange(currentRange);
      
      // Previous period should be April 1 to April 30
      expect(result.start).toMatch(/^2023-03-31T/);
      expect(result.end).toMatch(/^2023-04-30T/);
    });
    
    it('should handle custom length periods', () => {
      const currentRange = {
        start: '2023-05-15T00:00:00.000Z',
        end: '2023-05-20T23:59:59.999Z'
      };
      
      const result = getPreviousPeriodDateRange(currentRange);
      
      // Previous period should be 6 days before May 15
      expect(result.start).toMatch(/^2023-05-09T/);
      expect(result.end).toMatch(/^2023-05-14T/);
    });
  });
});
