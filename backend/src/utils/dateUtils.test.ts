import { parseDateRange, generateKlaviyoDateFilter, calculatePercentageChange, getPreviousPeriodDateRange } from './dateUtils';

describe('Date Utilities', () => {
  // Save original implementations
  const originalNow = Date.now;
  const originalDate = global.Date;
  
  beforeAll(() => {
    // Mock Date constructor and Date.now
    const mockDate = new Date('2023-05-15T12:00:00Z');
    const mockTimestamp = mockDate.getTime();
    
    // Mock Date.now
    Date.now = jest.fn(() => mockTimestamp);
    
    // Mock Date constructor
    global.Date = class extends Date {
      constructor() {
        if (arguments.length === 0) {
          super(mockTimestamp);
          return;
        }
        // @ts-ignore
        super(...arguments);
      }
    } as unknown as DateConstructor;
  });
  
  afterAll(() => {
    // Restore original implementations
    Date.now = originalNow;
    global.Date = originalDate;
  });
  
  describe('parseDateRange', () => {
    it('should parse last-30-days correctly', () => {
      const result = parseDateRange('last-30-days');
      
      // Expected: 30 days before mock date
      expect(result.start).toMatch(/^2023-04-14T/);
      expect(result.end).toMatch(/^2023-05-15T/);
    });
    
    it('should parse last-7-days correctly', () => {
      const result = parseDateRange('last-7-days');
      
      // Expected: 7 days before mock date
      expect(result.start).toMatch(/^2023-05-07T/);
      expect(result.end).toMatch(/^2023-05-15T/);
    });
    
    it('should parse custom date range correctly', () => {
      const result = parseDateRange('2023-01-01_to_2023-02-01');
      
      expect(result.start).toMatch(/^2022-12-31T/);
      expect(result.end).toMatch(/^2023-02-01T/);
    });
    
    it('should default to last-30-days if no range is provided', () => {
      const result = parseDateRange();
      
      expect(result.start).toMatch(/^2023-04-14T/);
      expect(result.end).toMatch(/^2023-05-15T/);
    });
    
    it('should default to last-30-days if an invalid format is provided', () => {
      const result = parseDateRange('invalid-format');
      
      expect(result.start).toMatch(/^2023-04-14T/);
      expect(result.end).toMatch(/^2023-05-15T/);
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
