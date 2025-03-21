import { SegmentRepository, segmentRepository, Segment } from '../segmentRepository';
import { db } from '../../utils/db';

// Mock the database
jest.mock('../../utils/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

// Mock logger to prevent console output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('SegmentRepository', () => {
  // Mock data
  const mockSegment: Segment = {
    id: 'seg_123',
    name: 'VIP Customers',
    status: 'active',
    member_count: 5000,
    active_count: 2500,
    conversion_rate: 8.5,
    revenue: 25000.50,
    created_date: new Date('2023-01-01'),
    created_at: new Date('2023-01-01T12:00:00Z'),
    updated_at: new Date('2023-01-02T12:00:00Z'),
    metadata: { source: 'klaviyo' }
  };

  const mockSegments = [
    mockSegment,
    {
      ...mockSegment,
      id: 'seg_456',
      name: 'Newsletter Subscribers',
      revenue: 15000.75,
    },
    {
      ...mockSegment,
      id: 'seg_789',
      name: 'Abandoned Cart',
      status: 'inactive',
      revenue: 0,
    }
  ] as Segment[];

  // Reset mocks between tests
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Mock the client object with the necessary methods
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    
    // Setup the db.getClient mock to return our mockClient
    (db.getClient as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('findById', () => {
    it('should find a segment by id', async () => {
      // Mock db.query to return a single segment
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockSegment],
      });

      const result = await segmentRepository.findById('seg_123');
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM klaviyo_segments WHERE id = $1'),
        ['seg_123']
      );
      expect(result).toEqual(mockSegment);
    });

    it('should return null if segment not found', async () => {
      // Mock db.query to return empty result
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await segmentRepository.findById('non_existent_id');
      
      expect(result).toBeNull();
    });

    it('should throw error if db query fails', async () => {
      // Mock db.query to throw an error
      const error = new Error('Database error');
      (db.query as jest.Mock).mockRejectedValueOnce(error);

      await expect(segmentRepository.findById('seg_123')).rejects.toThrow('Database error');
    });
  });

  describe('findByName', () => {
    it('should find segments by partial name match', async () => {
      // Mock db.query to return matching segments
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSegments.filter(s => s.name.includes('Customers')),
      });

      const result = await segmentRepository.findByName('Customers');
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM klaviyo_segments WHERE name ILIKE $1'),
        ['%Customers%']
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Customers');
    });
  });

  describe('findByStatus', () => {
    it('should find segments by status', async () => {
      // Mock db.query to return active segments
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSegments.filter(s => s.status === 'active'),
      });

      const result = await segmentRepository.findByStatus('active');
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM klaviyo_segments WHERE status = $1'),
        ['active']
      );
      expect(result).toHaveLength(2);
      expect(result.every(s => s.status === 'active')).toBe(true);
    });
  });

  describe('findByDateRange', () => {
    it('should find segments within date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      // Mock db.query to return segments
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSegments,
      });

      const result = await segmentRepository.findByDateRange(startDate, endDate);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM klaviyo_segments'),
        [startDate, endDate]
      );
      expect(result).toEqual(mockSegments);
    });
  });

  describe('create', () => {
    it('should create a new segment', async () => {
      // Omit created_at and updated_at as they'll be set in the method
      const { created_at, updated_at, ...segmentToCreate } = mockSegment;
      
      // Mock db.query to return the created segment
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockSegment],
      });

      const result = await segmentRepository.create(segmentToCreate);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO klaviyo_segments'),
        expect.arrayContaining([segmentToCreate.id, segmentToCreate.name])
      );
      expect(result).toEqual(mockSegment);
    });
  });

  describe('createOrUpdate', () => {
    it('should upsert a segment', async () => {
      // Omit updated_at as it'll be set in the method
      const { updated_at, ...segmentToUpsert } = mockSegment;
      
      // Mock db.query to return the upserted segment
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockSegment],
      });

      const result = await segmentRepository.createOrUpdate(segmentToUpsert);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO klaviyo_segments'),
        expect.arrayContaining([segmentToUpsert.id, segmentToUpsert.name])
      );
      expect(result).toEqual(mockSegment);
    });
  });

  describe('updateMetrics', () => {
    it('should update segment metrics', async () => {
      const metrics = {
        member_count: 6000,
        conversion_rate: 9.2,
        revenue: 30000,
      };
      
      // Mock db.query to return the updated segment
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          ...mockSegment,
          ...metrics,
          updated_at: new Date(),
        }],
      });

      const result = await segmentRepository.updateMetrics('seg_123', metrics);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE klaviyo_segments SET'),
        expect.arrayContaining(['seg_123'])
      );
      expect(result).toMatchObject(expect.objectContaining(metrics));
    });

    it('should return null if segment not found', async () => {
      // Mock db.query to return empty result
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await segmentRepository.updateMetrics('non_existent_id', { revenue: 1000 });
      
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a segment and return true on success', async () => {
      // Mock db.query to return deleted segment id
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'seg_123' }],
      });

      const result = await segmentRepository.delete('seg_123');
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM klaviyo_segments WHERE id = $1'),
        ['seg_123']
      );
      expect(result).toBe(true);
    });

    it('should return false if segment not found', async () => {
      // Mock db.query to return empty result
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await segmentRepository.delete('non_existent_id');
      
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should find all segments with pagination', async () => {
      // Mock db.query to return segments
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSegments,
      });

      const result = await segmentRepository.findAll(10, 0);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM klaviyo_segments'),
        [10, 0]
      );
      expect(result).toEqual(mockSegments);
    });
  });

  describe('createBatch', () => {
    it('should create multiple segments in a transaction', async () => {
      // Setup for transaction test
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      
      (db.getClient as jest.Mock).mockResolvedValue(mockClient);
      
      // Mock the transaction queries
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      
      // Mock insert results for each segment
      mockSegments.forEach(segment => {
        mockClient.query.mockResolvedValueOnce({ rows: [segment] });
      });
      
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Prepare data without created_at and updated_at
      const segmentsToCreate = mockSegments.map(({ created_at, updated_at, ...rest }) => rest);
      
      const result = await segmentRepository.createBatch(segmentsToCreate);
      
      // Check that transaction was started and committed
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      
      // Check that all segments were processed
      expect(result).toHaveLength(mockSegments.length);
      expect(result).toEqual(mockSegments);
      
      // Check that client was released
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Setup for transaction test
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      
      (db.getClient as jest.Mock).mockResolvedValue(mockClient);
      
      // Mock queries to simulate error during transaction
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('Insert error')); // Error on insert
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      // Prepare data without created_at and updated_at
      const segmentsToCreate = mockSegments.map(({ created_at, updated_at, ...rest }) => rest);
      
      await expect(segmentRepository.createBatch(segmentsToCreate)).rejects.toThrow('Insert error');
      
      // Check that transaction was started and rolled back
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      
      // Check that client was released
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return aggregated performance metrics', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      // Mock db.query to return aggregated metrics
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          total_segments: '3',
          active_segments: '2',
          inactive_segments: '1',
          total_members: '12500',
          avg_conversion_rate: '8.5',
          total_revenue: '40001.25',
          avg_revenue_per_segment: '13333.75'
        }],
      });

      const result = await segmentRepository.getPerformanceMetrics(startDate, endDate);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as total_segments'),
        [startDate, endDate]
      );
      
      expect(result).toEqual({
        totalSegments: 3,
        activeSegments: 2,
        inactiveSegments: 1,
        totalMembers: 12500,
        averageConversionRate: 8.5,
        totalRevenue: 40001.25,
        averageRevenuePerSegment: 13333.75
      });
    });

    it('should return zeros when no segments found', async () => {
      // Mock db.query to return empty result
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await segmentRepository.getPerformanceMetrics(new Date(), new Date());
      
      expect(result).toEqual({
        totalSegments: 0,
        activeSegments: 0,
        inactiveSegments: 0,
        totalMembers: 0,
        averageConversionRate: 0,
        totalRevenue: 0,
        averageRevenuePerSegment: 0
      });
    });
  });

  describe('findUpdatedSince', () => {
    it('should find segments updated since a given date', async () => {
      const since = new Date('2023-01-15');
      
      // Mock db.query to return updated segments
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSegments.slice(0, 1),
      });

      const result = await segmentRepository.findUpdatedSince(since);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM klaviyo_segments WHERE updated_at > $1'),
        [since]
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getLatestUpdateTimestamp', () => {
    it('should return the latest update timestamp', async () => {
      const latestDate = new Date('2023-01-31T12:00:00Z');
      
      // Mock db.query to return latest timestamp
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ latest: latestDate }],
      });

      const result = await segmentRepository.getLatestUpdateTimestamp();
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT MAX(updated_at)'),
      );
      expect(result).toEqual(latestDate);
    });

    it('should return null if no segments exist', async () => {
      // Mock db.query to return null timestamp
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ latest: null }],
      });

      const result = await segmentRepository.getLatestUpdateTimestamp();
      
      expect(result).toBeNull();
    });
  });

  describe('special queries', () => {
    it('should get top performing segments by revenue', async () => {
      // Mock db.query to return segments sorted by revenue
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSegments.filter(s => s.status === 'active' && s.revenue > 0)
          .sort((a, b) => (b.revenue || 0) - (a.revenue || 0)),
      });

      const result = await segmentRepository.getTopPerformingSegments(5);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY revenue DESC'),
        [5]
      );
      
      // Check first result has highest revenue
      expect(result[0].revenue).toBeGreaterThanOrEqual(result[1].revenue || 0);
    });

    it('should get segments with highest conversion rates', async () => {
      // Mock db.query to return segments sorted by conversion rate
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockSegments.filter(s => s.status === 'active' && (s.conversion_rate || 0) > 0)
          .sort((a, b) => (b.conversion_rate || 0) - (a.conversion_rate || 0)),
      });

      const result = await segmentRepository.getHighestConversionSegments(5);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY conversion_rate DESC'),
        [5]
      );
      
      // Active segments only
      expect(result.every(s => s.status === 'active')).toBe(true);
    });
  });
});