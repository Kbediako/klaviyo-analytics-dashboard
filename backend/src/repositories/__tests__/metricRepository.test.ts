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
    await db.close();
  });
  
  beforeEach(async () => {
    // Clear data before each test
    await db.query('DELETE FROM klaviyo_metrics');
    repository = new MetricRepository();
  });
  
  it('should create a new metric', async () => {
    const metric = await repository.create({
      id: 'test-metric-1',
      name: 'Test Metric',
      integration_id: 'test-integration',
      integration_name: 'Test Integration',
      integration_category: 'test'
    });
    
    expect(metric).toHaveProperty('id', 'test-metric-1');
    expect(metric).toHaveProperty('name', 'Test Metric');
    expect(metric).toHaveProperty('integration_id', 'test-integration');
    expect(metric).toHaveProperty('created_at');
    expect(metric).toHaveProperty('updated_at');
    
    // Verify in database
    const result = await db.query(
      'SELECT * FROM klaviyo_metrics WHERE id = $1', 
      ['test-metric-1']
    );
    expect(result.rows).toHaveLength(1);
  });
  
  it('should find a metric by ID', async () => {
    // Create test data
    await repository.create({
      id: 'test-metric-2',
      name: 'Test Metric 2',
      integration_category: 'test'
    });
    
    const metric = await repository.findById('test-metric-2');
    
    expect(metric).not.toBeNull();
    expect(metric).toHaveProperty('id', 'test-metric-2');
    expect(metric).toHaveProperty('name', 'Test Metric 2');
  });
  
  it('should return null when finding non-existent metric', async () => {
    const metric = await repository.findById('non-existent');
    
    expect(metric).toBeNull();
  });
  
  it('should find metrics by name', async () => {
    // Create test data
    await repository.create({
      id: 'test-metric-3',
      name: 'Special Test Metric',
      integration_category: 'test'
    });
    
    await repository.create({
      id: 'test-metric-4',
      name: 'Another Test Metric',
      integration_category: 'test'
    });
    
    const metrics = await repository.findByName('Special');
    
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toHaveProperty('id', 'test-metric-3');
    
    const allTestMetrics = await repository.findByName('Test');
    
    expect(allTestMetrics.length).toBeGreaterThanOrEqual(2);
  });
  
  it('should find metrics by category', async () => {
    // Create test data
    await repository.create({
      id: 'test-metric-5',
      name: 'Email Metric',
      integration_category: 'email'
    });
    
    await repository.create({
      id: 'test-metric-6',
      name: 'SMS Metric',
      integration_category: 'sms'
    });
    
    const emailMetrics = await repository.findByCategory('email');
    
    expect(emailMetrics).toHaveLength(1);
    expect(emailMetrics[0]).toHaveProperty('id', 'test-metric-5');
    
    const smsMetrics = await repository.findByCategory('sms');
    
    expect(smsMetrics).toHaveLength(1);
    expect(smsMetrics[0]).toHaveProperty('id', 'test-metric-6');
  });
  
  it('should create or update a metric', async () => {
    // Create new metric
    const metric1 = await repository.createOrUpdate({
      id: 'test-metric-7',
      name: 'Original Name',
      created_at: new Date(),
      integration_category: 'test'
    });
    
    expect(metric1).toHaveProperty('name', 'Original Name');
    
    // Update existing metric
    const metric2 = await repository.createOrUpdate({
      id: 'test-metric-7',
      name: 'Updated Name',
      created_at: metric1.created_at,
      integration_category: 'updated'
    });
    
    expect(metric2).toHaveProperty('name', 'Updated Name');
    expect(metric2).toHaveProperty('integration_category', 'updated');
    expect(metric2.created_at).toEqual(metric1.created_at);
    expect(metric2.updated_at).not.toEqual(metric1.updated_at);
    
    // Verify only one record exists
    const result = await db.query('SELECT COUNT(*) FROM klaviyo_metrics');
    expect(parseInt(result.rows[0].count, 10)).toBe(1);
  });
  
  it('should update specific fields of a metric', async () => {
    // Create test data
    await repository.create({
      id: 'test-metric-8',
      name: 'Original Name',
      integration_id: 'original-integration',
      integration_name: 'Original Integration',
      integration_category: 'original'
    });
    
    // Update only name and category
    const updated = await repository.update('test-metric-8', {
      name: 'Updated Name',
      integration_category: 'updated'
    });
    
    expect(updated).not.toBeNull();
    expect(updated).toHaveProperty('name', 'Updated Name');
    expect(updated).toHaveProperty('integration_category', 'updated');
    expect(updated).toHaveProperty('integration_id', 'original-integration');
    expect(updated).toHaveProperty('integration_name', 'Original Integration');
  });
  
  it('should delete a metric', async () => {
    // Create test data
    await repository.create({
      id: 'test-metric-9',
      name: 'To Be Deleted',
      integration_category: 'test'
    });
    
    const deleted = await repository.delete('test-metric-9');
    
    expect(deleted).toBe(true);
    
    // Verify it's gone
    const metric = await repository.findById('test-metric-9');
    expect(metric).toBeNull();
  });
  
  it('should return false when deleting non-existent metric', async () => {
    const deleted = await repository.delete('non-existent');
    
    expect(deleted).toBe(false);
  });
  
  it('should find all metrics with pagination', async () => {
    // Create multiple test metrics
    for (let i = 1; i <= 5; i++) {
      await repository.create({
        id: `pagination-test-${i}`,
        name: `Pagination Test ${i}`,
        integration_category: 'test'
      });
    }
    
    // Get first page (2 items)
    const page1 = await repository.findAll(2, 0);
    
    expect(page1).toHaveLength(2);
    
    // Get second page (2 items)
    const page2 = await repository.findAll(2, 2);
    
    expect(page2).toHaveLength(2);
    
    // Get third page (1 item)
    const page3 = await repository.findAll(2, 4);
    
    expect(page3).toHaveLength(1);
    
    // Ensure all IDs are unique across pages
    const allIds = [...page1, ...page2, ...page3].map(m => m.id);
    const uniqueIds = new Set(allIds);
    
    expect(uniqueIds.size).toBe(5);
  });
});
