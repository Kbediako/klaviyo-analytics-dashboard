import { db } from '../../database';
import { FlowRepository, Flow } from '../flowRepository';

describe('FlowRepository', () => {
  let flowRepository: FlowRepository;
  
  // Test flow data
  const testFlow: Omit<Flow, 'created_at' | 'updated_at'> = {
    id: 'test-flow-123',
    name: 'Test Welcome Flow',
    status: 'active',
    trigger_type: 'list',
    created_date: new Date('2023-01-01'),
    recipient_count: 1000,
    open_count: 800,
    click_count: 400,
    conversion_count: 200,
    revenue: 5000,
    metadata: {
      source: 'test',
      platform: 'email',
      tags: ['welcome', 'onboarding']
    }
  };
  
  // Setup test database before tests
  beforeAll(async () => {
    // Create a temporary flows table for testing
    await db.query(`
      CREATE TEMPORARY TABLE klaviyo_flows (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        trigger_type VARCHAR(100),
        created_date TIMESTAMPTZ,
        recipient_count INTEGER DEFAULT 0,
        open_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        conversion_count INTEGER DEFAULT 0,
        revenue DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        metadata JSONB
      );
    `);
    
    flowRepository = new FlowRepository();
  });
  
  // Clean up after each test
  afterEach(async () => {
    await db.query('DELETE FROM klaviyo_flows');
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await db.query('DROP TABLE IF EXISTS klaviyo_flows');
  });
  
  describe('create', () => {
    it('should create a new flow', async () => {
      const result = await flowRepository.create(testFlow);
      
      // Check if the flow was created
      expect(result).toBeDefined();
      expect(result.id).toBe(testFlow.id);
      expect(result.name).toBe(testFlow.name);
      expect(result.status).toBe(testFlow.status);
      expect(result.trigger_type).toBe(testFlow.trigger_type);
      expect(result.recipient_count).toBe(testFlow.recipient_count);
      expect(result.open_count).toBe(testFlow.open_count);
      expect(result.click_count).toBe(testFlow.click_count);
      expect(result.conversion_count).toBe(testFlow.conversion_count);
      expect(Number(result.revenue)).toBe(testFlow.revenue);
      
      // Check if timestamps were set
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      
      // Check if metadata was stored
      expect(result.metadata).toEqual(testFlow.metadata);
    });
  });
  
  describe('findById', () => {
    it('should find a flow by ID', async () => {
      // Create a flow first
      await flowRepository.create(testFlow);
      
      // Now find it by ID
      const result = await flowRepository.findById(testFlow.id);
      
      // Check if the flow was found
      expect(result).toBeDefined();
      expect(result?.id).toBe(testFlow.id);
      expect(result?.name).toBe(testFlow.name);
    });
    
    it('should return null for non-existent ID', async () => {
      // Try to find a flow with a non-existent ID
      const result = await flowRepository.findById('non-existent-id');
      
      // Check if null was returned
      expect(result).toBeNull();
    });
  });
  
  describe('findByName', () => {
    it('should find flows by partial name match', async () => {
      // Create flows first
      await flowRepository.create(testFlow);
      await flowRepository.create({
        ...testFlow,
        id: 'test-flow-456',
        name: 'Test Abandoned Cart Flow'
      });
      
      // Now find flows by partial name
      const results = await flowRepository.findByName('Welcome');
      
      // Check if the flow was found
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(testFlow.id);
      expect(results[0].name).toBe(testFlow.name);
      
      // Try a different search
      const resultsAll = await flowRepository.findByName('Test');
      expect(resultsAll).toHaveLength(2);
    });
    
    it('should return empty array for no matches', async () => {
      // Create a flow first
      await flowRepository.create(testFlow);
      
      // Try to find flows with a non-matching name
      const results = await flowRepository.findByName('NonExistentName');
      
      // Check if empty array was returned
      expect(results).toHaveLength(0);
    });
  });
  
  describe('createOrUpdate', () => {
    it('should create a new flow if it does not exist', async () => {
      const result = await flowRepository.createOrUpdate({
        ...testFlow,
        created_at: new Date('2023-01-01T00:00:00Z')
      });
      
      // Check if the flow was created
      expect(result).toBeDefined();
      expect(result.id).toBe(testFlow.id);
      expect(result.name).toBe(testFlow.name);
      expect(result.created_at).toEqual(new Date('2023-01-01T00:00:00Z'));
    });
    
    it('should update an existing flow', async () => {
      // Create a flow first
      await flowRepository.create(testFlow);
      
      // Now update it
      const updatedFlow = {
        ...testFlow,
        name: 'Updated Flow Name',
        status: 'draft',
        recipient_count: 2000,
        created_at: new Date('2023-01-01T00:00:00Z')
      };
      
      const result = await flowRepository.createOrUpdate(updatedFlow);
      
      // Check if the flow was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(testFlow.id);
      expect(result.name).toBe(updatedFlow.name);
      expect(result.status).toBe(updatedFlow.status);
      expect(result.recipient_count).toBe(updatedFlow.recipient_count);
      
      // Created_at should not change
      expect(result.created_at).toEqual(new Date('2023-01-01T00:00:00Z'));
      
      // Updated_at should change
      expect(result.updated_at).not.toEqual(result.created_at);
    });
  });
  
  describe('updateMetrics', () => {
    it('should update only the specified metrics', async () => {
      // Create a flow first
      const created = await flowRepository.create(testFlow);
      
      // Wait a moment to ensure updated_at will be different
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Now update specific metrics
      const result = await flowRepository.updateMetrics(testFlow.id, {
        recipient_count: 1500,
        open_count: 900
      });
      
      // Check if the metrics were updated
      expect(result).toBeDefined();
      expect(result?.id).toBe(testFlow.id);
      expect(result?.recipient_count).toBe(1500);
      expect(result?.open_count).toBe(900);
      
      // These should remain unchanged
      expect(result?.click_count).toBe(testFlow.click_count);
      expect(result?.conversion_count).toBe(testFlow.conversion_count);
      expect(Number(result?.revenue)).toBe(testFlow.revenue);
      
      // Updated_at should be newer
      expect(result?.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });
    
    it('should return null for non-existent ID', async () => {
      // Try to update metrics for a non-existent flow
      const result = await flowRepository.updateMetrics('non-existent-id', {
        recipient_count: 1500
      });
      
      // Check if null was returned
      expect(result).toBeNull();
    });
  });
  
  describe('createBatch', () => {
    it('should create multiple flows in a batch', async () => {
      const flows = [
        testFlow,
        {
          ...testFlow,
          id: 'test-flow-456',
          name: 'Test Abandoned Cart Flow',
          status: 'draft'
        },
        {
          ...testFlow,
          id: 'test-flow-789',
          name: 'Test Post-Purchase Flow',
          status: 'active'
        }
      ];
      
      // Create flows in a batch
      const results = await flowRepository.createBatch(flows);
      
      // Check if all flows were created
      expect(results).toHaveLength(3);
      expect(results.map(f => f.id)).toEqual(flows.map(f => f.id));
      expect(results.map(f => f.name)).toEqual(flows.map(f => f.name));
      
      // Check if data is stored in the database
      const dbFlows = await flowRepository.findAll(10, 0);
      expect(dbFlows).toHaveLength(3);
    });
  });
  
  describe('getPerformanceMetrics', () => {
    it('should calculate performance metrics correctly', async () => {
      // Create multiple flows
      await flowRepository.createBatch([
        testFlow,
        {
          ...testFlow,
          id: 'test-flow-456',
          name: 'Test Abandoned Cart Flow',
          recipient_count: 2000,
          open_count: 1000,
          click_count: 500,
          conversion_count: 100,
          revenue: 3000
        }
      ]);
      
      // Get performance metrics
      const startDate = new Date('2022-01-01');
      const endDate = new Date('2024-01-01');
      const metrics = await flowRepository.getPerformanceMetrics(startDate, endDate);
      
      // Check metrics calculations
      expect(metrics.totalFlows).toBe(2);
      expect(metrics.totalRecipients).toBe(3000); // 1000 + 2000
      expect(metrics.totalOpens).toBe(1800); // 800 + 1000
      expect(metrics.totalClicks).toBe(900); // 400 + 500
      expect(metrics.totalConversions).toBe(300); // 200 + 100
      expect(metrics.totalRevenue).toBe(8000); // 5000 + 3000
      
      // Check rate calculations
      expect(metrics.avgOpenRate).toBeCloseTo((1800 / 3000) * 100, 2); // (totalOpens / totalRecipients) * 100
      expect(metrics.avgClickRate).toBeCloseTo((900 / 1800) * 100, 2); // (totalClicks / totalOpens) * 100
      expect(metrics.avgConversionRate).toBeCloseTo((300 / 3000) * 100, 2); // (totalConversions / totalRecipients) * 100
    });
    
    it('should return zeros when no flows match date range', async () => {
      // Create a flow
      await flowRepository.create(testFlow);
      
      // Get performance metrics for a different time range
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2026-01-01');
      const metrics = await flowRepository.getPerformanceMetrics(startDate, endDate);
      
      // Check if zero metrics were returned
      expect(metrics.totalFlows).toBe(0);
      expect(metrics.totalRecipients).toBe(0);
      expect(metrics.totalOpens).toBe(0);
      expect(metrics.totalClicks).toBe(0);
      expect(metrics.totalConversions).toBe(0);
      expect(metrics.totalRevenue).toBe(0);
      expect(metrics.avgOpenRate).toBe(0);
      expect(metrics.avgClickRate).toBe(0);
      expect(metrics.avgConversionRate).toBe(0);
    });
  });

  describe('findUpdatedSince', () => {
    it('should find flows updated since a given timestamp', async () => {
      // Create a flow
      const firstFlow = await flowRepository.create(testFlow);
      
      // Wait a moment to ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Create another flow
      const secondFlow = await flowRepository.create({
        ...testFlow,
        id: 'test-flow-456',
        name: 'Test Abandoned Cart Flow'
      });
      
      // Find flows updated after the first flow's creation
      const cutoffTime = new Date(firstFlow.updated_at.getTime() + 1);
      const updatedFlows = await flowRepository.findUpdatedSince(cutoffTime);
      
      // Should only find the second flow
      expect(updatedFlows).toHaveLength(1);
      expect(updatedFlows[0].id).toBe('test-flow-456');
      expect(updatedFlows[0].name).toBe('Test Abandoned Cart Flow');
    });
    
    it('should return empty array when no flows are updated since the timestamp', async () => {
      // Create a flow
      await flowRepository.create(testFlow);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Use current time as cutoff
      const cutoffTime = new Date();
      const updatedFlows = await flowRepository.findUpdatedSince(cutoffTime);
      
      // Should find no flows
      expect(updatedFlows).toHaveLength(0);
    });
  });

  describe('getLatestUpdateTimestamp', () => {
    it('should return the latest update timestamp', async () => {
      // Create a flow
      const firstFlow = await flowRepository.create(testFlow);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Create another flow with a later timestamp
      const secondFlow = await flowRepository.create({
        ...testFlow,
        id: 'test-flow-456',
        name: 'Test Abandoned Cart Flow'
      });
      
      // Get latest timestamp
      const latestTimestamp = await flowRepository.getLatestUpdateTimestamp();
      
      // Should match the second flow's updated_at
      expect(latestTimestamp).toBeInstanceOf(Date);
      expect(latestTimestamp?.getTime()).toBe(secondFlow.updated_at.getTime());
    });
    
    it('should return null when no flows exist', async () => {
      // Get latest timestamp from empty table
      const latestTimestamp = await flowRepository.getLatestUpdateTimestamp();
      
      // Should be null
      expect(latestTimestamp).toBeNull();
    });
  });
});