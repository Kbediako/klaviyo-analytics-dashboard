import request from 'supertest';
import app from '../index';
import { db } from '../database';
import { MetricRepository } from '../repositories/metricRepository';
import { EventRepository } from '../repositories/eventRepository';
import { CampaignRepository } from '../repositories/campaignRepository';

describe('API Endpoints', () => {
  let metricRepository: MetricRepository;
  let eventRepository: EventRepository;
  let campaignRepository: CampaignRepository;
  
  beforeAll(async () => {
    // Setup test database with sample data
    metricRepository = new MetricRepository();
    eventRepository = new EventRepository();
    campaignRepository = new CampaignRepository();
    
    // Create test metrics
    await metricRepository.create({
      id: 'test-metric-1',
      name: 'Opened Email',
      integration_category: 'email'
    });
    
    await metricRepository.create({
      id: 'test-metric-2',
      name: 'Placed Order',
      integration_category: 'ecommerce'
    });
    
    // Create test campaigns
    await campaignRepository.create({
      id: 'test-campaign-1',
      name: 'Test Campaign 1',
      status: 'sent',
      send_time: new Date('2023-01-15'),
      sent_count: 1000,
      open_count: 250,
      click_count: 100,
      conversion_count: 50,
      revenue: 5000,
      metadata: {
        open_rate: 0.25,
        click_rate: 0.1,
        conversion_rate: 0.05
      }
    });
    
    await campaignRepository.create({
      id: 'test-campaign-2',
      name: 'Test Campaign 2',
      status: 'sent',
      send_time: new Date('2023-01-20'),
      sent_count: 2000,
      open_count: 600,
      click_count: 300,
      conversion_count: 140,
      revenue: 8000,
      metadata: {
        open_rate: 0.3,
        click_rate: 0.15,
        conversion_rate: 0.07
      }
    });
    
    // Create test events
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (let i = 0; i < 10; i++) {
      await eventRepository.create({
        id: `test-event-${i}`,
        metric_id: i % 2 === 0 ? 'test-metric-1' : 'test-metric-2',
        profile_id: `profile-${i % 3}`,
        timestamp: new Date(yesterday.getTime() + i * 3600000), // 1 hour apart
        value: i * 10,
        properties: { source: i % 2 === 0 ? 'email' : 'web' },
        raw_data: { 
          id: `test-event-${i}`,
          type: 'event',
          attributes: {
            value: i * 10,
            source: i % 2 === 0 ? 'email' : 'web'
          }
        }
      });
    }
  });
  
  afterAll(async () => {
    // Clean up test data
    await db.query('DELETE FROM klaviyo_events WHERE id LIKE $1', ['test-event-%']);
    await db.query('DELETE FROM klaviyo_campaigns WHERE id LIKE $1', ['test-campaign-%']);
    await db.query('DELETE FROM klaviyo_metrics WHERE id LIKE $1', ['test-metric-%']);
  });
  
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
  
  describe('GET /api/campaigns', () => {
    it('should return campaigns data', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .query({ dateRange: 'last-30-days' });
      
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check structure of first campaign
      const campaign = response.body[0];
      expect(campaign).toHaveProperty('id');
      expect(campaign).toHaveProperty('name');
      expect(campaign).toHaveProperty('status');
      expect(campaign).toHaveProperty('metrics');
      expect(campaign.metrics).toHaveProperty('sent');
      expect(campaign.metrics).toHaveProperty('openRate');
    });
    
    it('should filter campaigns by date range', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .query({ 
          dateRange: 'custom',
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/analytics/timeseries/:metricId', () => {
    it('should return time series data for a metric', async () => {
      const response = await request(app)
        .get('/api/analytics/timeseries/test-metric-1')
        .query({ 
          dateRange: 'last-7-days',
          interval: 'day'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metric');
      expect(response.body.data).toBeInstanceOf(Array);
    });
    
    it('should handle invalid metric ID', async () => {
      const response = await request(app)
        .get('/api/analytics/timeseries/non-existent-metric')
        .query({ dateRange: 'last-7-days' });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('GET /api/analytics/forecast/:metricId', () => {
    it('should return forecast data for a metric', async () => {
      const response = await request(app)
        .get('/api/analytics/forecast/test-metric-1')
        .query({ 
          dateRange: 'last-30-days',
          horizon: 7,
          method: 'naive'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('forecast');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body.forecast).toBeInstanceOf(Array);
      expect(response.body.forecast.length).toBe(7);
    });
    
    it('should handle invalid forecast parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/forecast/test-metric-1')
        .query({ 
          dateRange: 'last-30-days',
          horizon: 'invalid'
        });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('GET /api/analytics/decomposition/:metricId', () => {
    it('should return time series decomposition for a metric', async () => {
      const response = await request(app)
        .get('/api/analytics/decomposition/test-metric-1')
        .query({ dateRange: 'last-30-days' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trend');
      expect(response.body).toHaveProperty('seasonal');
      expect(response.body).toHaveProperty('residual');
      expect(response.body.trend).toBeInstanceOf(Array);
    });
  });
  
  describe('GET /api/overview', () => {
    it('should return overview metrics', async () => {
      const response = await request(app)
        .get('/api/overview')
        .query({ dateRange: 'last-30-days' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('campaigns');
      expect(response.body).toHaveProperty('flows');
      expect(response.body.metrics).toBeInstanceOf(Array);
    });
  });
  
  describe('Error handling', () => {
    it('should handle invalid date range', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .query({ 
          dateRange: 'invalid-range'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle missing required parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/forecast/test-metric-1');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle server errors gracefully', async () => {
      // Force a server error by passing invalid parameters
      const response = await request(app)
        .get('/api/analytics/decomposition/test-metric-1')
        .query({ 
          dateRange: 'custom',
          startDate: 'invalid-date'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
