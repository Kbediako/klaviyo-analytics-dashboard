import { MetricRepository, Metric } from '../metricRepository';
import { db } from '../../database';

describe('MetricRepository', () => {
  let repository: MetricRepository;
  
  beforeAll(async () => {
    // Setup test database
    await db.query(`
      CREATE TABLE IF NOT EXISTS klaviyo_metrics (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        integration_id VARCHAR(50),
        integration_name VARCHAR(255),
        integration_category VARCHAR(255),
        metadata JSONB
      )
    `);
  });
  
  afterAll(async () => {
    // Cleanup test database
    await db.query('DROP TABLE IF EXISTS klaviyo_metrics');
    // Note: We don't close the pool here as it might be used by other tests
    // The pool will be closed when the process exits
  });
  
  beforeEach(async () => {
    // Clear data before each test
    await db.query('DELETE FROM klaviyo_metrics');
    repository = new MetricRepository();
  });
  
  describe('create', () => {
    it('should create a new metric', async () => {
      const metricData = {
        id: 'test-metric-1',
        name: 'Test Metric',
        integration_id: 'test-integration',
        integration_name: 'Test Integration',
        integration_category: 'test'
      };
      
      const metric = await repository.create(metricData);
      
      expect(metric).toHaveProperty('id', 'test-metric-1');
      expect(metric).toHaveProperty('name', 'Test Metric');
      expect(metric).toHaveProperty('integration_id', 'test-integration');
      expect(metric).toHaveProperty('integration_name', 'Test Integration');
      expect(metric).toHaveProperty('integration_category', 'test');
      expect(metric).toHaveProperty('created_at');
      expect(metric).toHaveProperty('updated_at');
      
      // Verify in database
      const result = await db.query(
        'SELECT * FROM klaviyo_metrics WHERE id = $1', 
        ['test-metric-1']
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Test Metric');
    });
    
    it('should create a metric with minimal data', async () => {
      const metricData = {
        id: 'minimal-metric',
        name: 'Minimal Metric'
      };
      
      const metric = await repository.create(metricData);
      
      expect(metric).toHaveProperty('id', 'minimal-metric');
      expect(metric).toHaveProperty('name', 'Minimal Metric');
      expect(metric.integration_id).toBeNull();
      expect(metric.integration_name).toBeNull();
      expect(metric.integration_category).toBeNull();
      expect(metric.metadata).toEqual({});
    });
  });
  
  describe('findById', () => {
    it('should find a metric by ID', async () => {
      // Create test data
      await repository.create({
        id: 'find-metric',
        name: 'Find Metric'
      });
      
      const metric = await repository.findById('find-metric');
      
      expect(metric).not.toBeNull();
      expect(metric).toHaveProperty('id', 'find-metric');
      expect(metric).toHaveProperty('name', 'Find Metric');
    });
    
    it('should return null if metric not found', async () => {
      const metric = await repository.findById('non-existent');
      
      expect(metric).toBeNull();
    });
  });
  
  describe('findByName', () => {
    beforeEach(async () => {
      // Create test data
      await repository.create({ id: 'metric-1', name: 'Test Metric One' });
      await repository.create({ id: 'metric-2', name: 'Test Metric Two' });
      await repository.create({ id: 'metric-3', name: 'Another Metric' });
    });
    
    it('should find metrics by name (partial match)', async () => {
      const metrics = await repository.findByName('Test');
      
      expect(metrics).toHaveLength(2);
      expect(metrics[0]).toHaveProperty('name', 'Test Metric One');
      expect(metrics[1]).toHaveProperty('name', 'Test Metric Two');
    });
    
    it('should return empty array if no matches', async () => {
      const metrics = await repository.findByName('Non-existent');
      
      expect(metrics).toHaveLength(0);
    });
  });
  
  describe('findByCategory', () => {
    beforeEach(async () => {
      // Create test data
      await repository.create({ 
        id: 'email-metric-1', 
        name: 'Email Metric 1',
        integration_category: 'email'
      });
      await repository.create({ 
        id: 'email-metric-2', 
        name: 'Email Metric 2',
        integration_category: 'email'
      });
      await repository.create({ 
        id: 'sms-metric', 
        name: 'SMS Metric',
        integration_category: 'sms'
      });
    });
    
    it('should find metrics by category', async () => {
      const metrics = await repository.findByCategory('email');
      
      expect(metrics).toHaveLength(2);
      expect(metrics[0]).toHaveProperty('integration_category', 'email');
      expect(metrics[1]).toHaveProperty('integration_category', 'email');
    });
    
    it('should return empty array if no matches', async () => {
      const metrics = await repository.findByCategory('non-existent');
      
      expect(metrics).toHaveLength(0);
    });
  });
  
  describe('createOrUpdate', () => {
    it('should create a new metric if it does not exist', async () => {
      const metricData = {
        id: 'new-metric',
        name: 'New Metric',
        created_at: new Date('2023-01-01')
      };
      
      const metric = await repository.createOrUpdate(metricData);
      
      expect(metric).toHaveProperty('id', 'new-metric');
      expect(metric).toHaveProperty('name', 'New Metric');
      expect(metric.created_at).toEqual(metricData.created_at);
      
      // Verify in database
      const result = await db.query(
        'SELECT * FROM klaviyo_metrics WHERE id = $1', 
        ['new-metric']
      );
      expect(result.rows).toHaveLength(1);
    });
    
    it('should update an existing metric', async () => {
      // Create initial metric
      await repository.create({
        id: 'update-metric',
        name: 'Original Name'
      });
      
      // Update the metric
      const updatedData = {
        id: 'update-metric',
        name: 'Updated Name',
        created_at: new Date('2023-01-01')
      };
      
      const metric = await repository.createOrUpdate(updatedData);
      
      expect(metric).toHaveProperty('id', 'update-metric');
      expect(metric).toHaveProperty('name', 'Updated Name');
      
      // Verify in database
      const result = await db.query(
        'SELECT * FROM klaviyo_metrics WHERE id = $1', 
        ['update-metric']
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Updated Name');
    });
  });
  
  describe('update', () => {
    beforeEach(async () => {
      // Create test data
      await repository.create({
        id: 'update-test',
        name: 'Original Name',
        integration_id: 'original-integration',
        integration_name: 'Original Integration',
        integration_category: 'original',
        metadata: { original: true }
      });
    });
    
    it('should update specific fields of a metric', async () => {
      const updates = {
        name: 'Updated Name',
        integration_category: 'updated'
      };
      
      const metric = await repository.update('update-test', updates);
      
      expect(metric).not.toBeNull();
      expect(metric).toHaveProperty('name', 'Updated Name');
      expect(metric).toHaveProperty('integration_category', 'updated');
      expect(metric).toHaveProperty('integration_id', 'original-integration');
      expect(metric).toHaveProperty('integration_name', 'Original Integration');
      
      // Verify in database
      const result = await db.query(
        'SELECT * FROM klaviyo_metrics WHERE id = $1', 
        ['update-test']
      );
      expect(result.rows[0].name).toBe('Updated Name');
      expect(result.rows[0].integration_category).toBe('updated');
    });
    
    it('should update metadata', async () => {
      const updates = {
        metadata: { updated: true, newField: 'value' }
      };
      
      const metric = await repository.update('update-test', updates);
      
      expect(metric).not.toBeNull();
      expect(metric?.metadata).toEqual({ updated: true, newField: 'value' });
      
      // Verify in database
      const result = await db.query(
        'SELECT * FROM klaviyo_metrics WHERE id = $1', 
        ['update-test']
      );
      expect(result.rows[0].metadata).toEqual({ updated: true, newField: 'value' });
    });
    
    it('should return null if metric not found', async () => {
      const updates = {
        name: 'Updated Name'
      };
      
      const metric = await repository.update('non-existent', updates);
      
      expect(metric).toBeNull();
    });
  });
  
  describe('delete', () => {
    beforeEach(async () => {
      // Create test data
      await repository.create({ id: 'delete-me', name: 'Delete Me' });
    });
    
    it('should delete a metric by ID', async () => {
      const result = await repository.delete('delete-me');
      
      expect(result).toBe(true);
      
      // Verify deletion
      const dbResult = await db.query(
        'SELECT * FROM klaviyo_metrics WHERE id = $1', 
        ['delete-me']
      );
      expect(dbResult.rows).toHaveLength(0);
    });
    
    it('should return false if metric not found', async () => {
      const result = await repository.delete('non-existent');
      
      expect(result).toBe(false);
    });
  });
  
  describe('findAll', () => {
    beforeEach(async () => {
      // Create test data
      for (let i = 1; i <= 15; i++) {
        await repository.create({
          id: `metric-${i}`,
          name: `Metric ${i}`
        });
      }
    });
    
    it('should find all metrics with default pagination', async () => {
      const metrics = await repository.findAll();
      
      expect(metrics.length).toBeLessThanOrEqual(100);
      expect(metrics.length).toBeGreaterThan(0);
    });
    
    it('should respect limit parameter', async () => {
      const metrics = await repository.findAll(5);
      
      expect(metrics).toHaveLength(5);
    });
    
    it('should respect offset parameter', async () => {
      // Get first page
      const firstPage = await repository.findAll(10, 0);
      // Get second page
      const secondPage = await repository.findAll(10, 10);
      
      expect(firstPage).toHaveLength(10);
      expect(secondPage.length).toBeGreaterThan(0);
      
      // Ensure no overlap between pages
      const firstPageIds = firstPage.map(m => m.id);
      const secondPageIds = secondPage.map(m => m.id);
      const overlap = firstPageIds.filter(id => secondPageIds.includes(id));
      
      expect(overlap).toHaveLength(0);
    });
  });
});
