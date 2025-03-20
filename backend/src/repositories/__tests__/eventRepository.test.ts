import { EventRepository, Event } from '../eventRepository';
import { MetricRepository } from '../metricRepository';
import { db } from '../../database';

describe('EventRepository', () => {
  let eventRepository: EventRepository;
  let metricRepository: MetricRepository;
  
  beforeAll(async () => {
    // Setup test database tables
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
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS klaviyo_profiles (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255),
        phone_number VARCHAR(20),
        external_id VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        properties JSONB,
        last_event_date TIMESTAMPTZ
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS klaviyo_events (
        id VARCHAR(50) PRIMARY KEY,
        metric_id VARCHAR(50) NOT NULL REFERENCES klaviyo_metrics(id),
        profile_id VARCHAR(50) NOT NULL REFERENCES klaviyo_profiles(id),
        timestamp TIMESTAMPTZ NOT NULL,
        value DECIMAL(12,2),
        properties JSONB NOT NULL,
        raw_data JSONB NOT NULL
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS klaviyo_aggregated_metrics (
        metric_id VARCHAR(50) NOT NULL REFERENCES klaviyo_metrics(id),
        time_bucket TIMESTAMPTZ NOT NULL,
        bucket_size VARCHAR(10) NOT NULL,
        count INTEGER NOT NULL,
        sum_value DECIMAL(12,2) NOT NULL,
        min_value DECIMAL(12,2),
        max_value DECIMAL(12,2),
        avg_value DECIMAL(12,2),
        PRIMARY KEY (metric_id, time_bucket, bucket_size)
      )
    `);
    
    // Create test metric and profile
    await db.query(`
      INSERT INTO klaviyo_metrics (id, name, created_at, updated_at)
      VALUES 
        ('test-metric-1', 'Test Metric 1', NOW(), NOW()),
        ('test-metric-2', 'Test Metric 2', NOW(), NOW())
    `);
    
    await db.query(`
      INSERT INTO klaviyo_profiles (id, email, first_name, last_name, created_at, updated_at, properties)
      VALUES 
        ('test-profile-1', 'test1@example.com', 'Test', 'User1', NOW(), NOW(), '{}'),
        ('test-profile-2', 'test2@example.com', 'Test', 'User2', NOW(), NOW(), '{}')
    `);
  });
  
  afterAll(async () => {
    // Cleanup test database
    await db.query('DROP TABLE IF EXISTS klaviyo_aggregated_metrics');
    await db.query('DROP TABLE IF EXISTS klaviyo_events');
    await db.query('DROP TABLE IF EXISTS klaviyo_profiles');
    await db.query('DROP TABLE IF EXISTS klaviyo_metrics');
    await db.close();
  });
  
  beforeEach(async () => {
    // Clear events data before each test
    await db.query('DELETE FROM klaviyo_events');
    await db.query('DELETE FROM klaviyo_aggregated_metrics');
    eventRepository = new EventRepository();
    metricRepository = new MetricRepository();
  });
  
  it('should create a new event', async () => {
    const event: Event = {
      id: 'test-event-1',
      metric_id: 'test-metric-1',
      profile_id: 'test-profile-1',
      timestamp: new Date(),
      value: 10.5,
      properties: { source: 'email' },
      raw_data: { original_event: 'data' }
    };
    
    const createdEvent = await eventRepository.create(event);
    
    expect(createdEvent).toHaveProperty('id', 'test-event-1');
    expect(createdEvent).toHaveProperty('metric_id', 'test-metric-1');
    expect(createdEvent).toHaveProperty('profile_id', 'test-profile-1');
    expect(createdEvent).toHaveProperty('value', '10.50'); // Note: PostgreSQL returns decimal as string
    
    // Verify in database
    const result = await db.query(
      'SELECT * FROM klaviyo_events WHERE id = $1', 
      ['test-event-1']
    );
    expect(result.rows).toHaveLength(1);
  });
  
  it('should create multiple events in a batch', async () => {
    const events: Event[] = [
      {
        id: 'batch-event-1',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        value: 5.75,
        properties: { source: 'email' },
        raw_data: { data: 1 }
      },
      {
        id: 'batch-event-2',
        metric_id: 'test-metric-2',
        profile_id: 'test-profile-2',
        timestamp: new Date(),
        value: 12.25,
        properties: { source: 'sms' },
        raw_data: { data: 2 }
      }
    ];
    
    const createdEvents = await eventRepository.createBatch(events);
    
    expect(createdEvents).toHaveLength(2);
    
    // Verify in database
    const result = await db.query('SELECT COUNT(*) FROM klaviyo_events');
    expect(parseInt(result.rows[0].count, 10)).toBe(2);
  });
  
  it('should find an event by ID', async () => {
    // Create test event
    const event: Event = {
      id: 'find-event-1',
      metric_id: 'test-metric-1',
      profile_id: 'test-profile-1',
      timestamp: new Date(),
      value: 15.0,
      properties: { source: 'web' },
      raw_data: { data: 'test' }
    };
    
    await eventRepository.create(event);
    
    const foundEvent = await eventRepository.findById('find-event-1');
    
    expect(foundEvent).not.toBeNull();
    expect(foundEvent).toHaveProperty('id', 'find-event-1');
    expect(foundEvent).toHaveProperty('metric_id', 'test-metric-1');
    expect(foundEvent).toHaveProperty('profile_id', 'test-profile-1');
  });
  
  it('should find events by metric ID', async () => {
    // Create test events
    const events: Event[] = [
      {
        id: 'metric-event-1',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        properties: { source: 'email' },
        raw_data: { data: 1 }
      },
      {
        id: 'metric-event-2',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-2',
        timestamp: new Date(),
        properties: { source: 'sms' },
        raw_data: { data: 2 }
      },
      {
        id: 'metric-event-3',
        metric_id: 'test-metric-2',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        properties: { source: 'web' },
        raw_data: { data: 3 }
      }
    ];
    
    await eventRepository.createBatch(events);
    
    const metric1Events = await eventRepository.findByMetricId('test-metric-1');
    
    expect(metric1Events).toHaveLength(2);
    expect(metric1Events.map(e => e.id)).toContain('metric-event-1');
    expect(metric1Events.map(e => e.id)).toContain('metric-event-2');
    
    const metric2Events = await eventRepository.findByMetricId('test-metric-2');
    
    expect(metric2Events).toHaveLength(1);
    expect(metric2Events[0]).toHaveProperty('id', 'metric-event-3');
  });
  
  it('should find events by profile ID', async () => {
    // Create test events
    const events: Event[] = [
      {
        id: 'profile-event-1',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        properties: { source: 'email' },
        raw_data: { data: 1 }
      },
      {
        id: 'profile-event-2',
        metric_id: 'test-metric-2',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        properties: { source: 'web' },
        raw_data: { data: 2 }
      },
      {
        id: 'profile-event-3',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-2',
        timestamp: new Date(),
        properties: { source: 'sms' },
        raw_data: { data: 3 }
      }
    ];
    
    await eventRepository.createBatch(events);
    
    const profile1Events = await eventRepository.findByProfileId('test-profile-1');
    
    expect(profile1Events).toHaveLength(2);
    expect(profile1Events.map(e => e.id)).toContain('profile-event-1');
    expect(profile1Events.map(e => e.id)).toContain('profile-event-2');
    
    const profile2Events = await eventRepository.findByProfileId('test-profile-2');
    
    expect(profile2Events).toHaveLength(1);
    expect(profile2Events[0]).toHaveProperty('id', 'profile-event-3');
  });
  
  it('should find events by time range', async () => {
    // Create test events with different timestamps
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const events: Event[] = [
      {
        id: 'time-event-1',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-1',
        timestamp: now,
        properties: { source: 'email' },
        raw_data: { data: 1 }
      },
      {
        id: 'time-event-2',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-1',
        timestamp: yesterday,
        properties: { source: 'web' },
        raw_data: { data: 2 }
      },
      {
        id: 'time-event-3',
        metric_id: 'test-metric-2',
        profile_id: 'test-profile-2',
        timestamp: lastWeek,
        properties: { source: 'sms' },
        raw_data: { data: 3 }
      }
    ];
    
    await eventRepository.createBatch(events);
    
    // Find events from yesterday to now
    const recentEvents = await eventRepository.findByTimeRange(yesterday, now);
    
    expect(recentEvents).toHaveLength(2);
    expect(recentEvents.map(e => e.id)).toContain('time-event-1');
    expect(recentEvents.map(e => e.id)).toContain('time-event-2');
    
    // Find events from last week to yesterday
    const olderEvents = await eventRepository.findByTimeRange(lastWeek, yesterday);
    
    expect(olderEvents).toHaveLength(2);
    expect(olderEvents.map(e => e.id)).toContain('time-event-2');
    expect(olderEvents.map(e => e.id)).toContain('time-event-3');
    
    // Find events with metric filter
    const metric1Events = await eventRepository.findByTimeRange(lastWeek, now, 'test-metric-1');
    
    expect(metric1Events).toHaveLength(2);
    expect(metric1Events.map(e => e.id)).toContain('time-event-1');
    expect(metric1Events.map(e => e.id)).toContain('time-event-2');
  });
  
  it('should get count by metric ID', async () => {
    // Create test events
    const events: Event[] = [
      {
        id: 'count-event-1',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        properties: { source: 'email' },
        raw_data: { data: 1 }
      },
      {
        id: 'count-event-2',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-2',
        timestamp: new Date(),
        properties: { source: 'web' },
        raw_data: { data: 2 }
      },
      {
        id: 'count-event-3',
        metric_id: 'test-metric-2',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        properties: { source: 'sms' },
        raw_data: { data: 3 }
      }
    ];
    
    await eventRepository.createBatch(events);
    
    const metric1Count = await eventRepository.getCountByMetricId('test-metric-1');
    
    expect(metric1Count).toBe(2);
    
    const metric2Count = await eventRepository.getCountByMetricId('test-metric-2');
    
    expect(metric2Count).toBe(1);
  });
  
  it('should get sum by metric ID', async () => {
    // Create test events with values
    const events: Event[] = [
      {
        id: 'sum-event-1',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        value: 10.5,
        properties: { source: 'email' },
        raw_data: { data: 1 }
      },
      {
        id: 'sum-event-2',
        metric_id: 'test-metric-1',
        profile_id: 'test-profile-2',
        timestamp: new Date(),
        value: 20.75,
        properties: { source: 'web' },
        raw_data: { data: 2 }
      },
      {
        id: 'sum-event-3',
        metric_id: 'test-metric-2',
        profile_id: 'test-profile-1',
        timestamp: new Date(),
        value: 15.25,
        properties: { source: 'sms' },
        raw_data: { data: 3 }
      }
    ];
    
    await eventRepository.createBatch(events);
    
    const metric1Sum = await eventRepository.getSumByMetricId('test-metric-1');
    
    expect(metric1Sum).toBe(31.25); // 10.5 + 20.75
    
    const metric2Sum = await eventRepository.getSumByMetricId('test-metric-2');
    
    expect(metric2Sum).toBe(15.25);
  });
  
  it('should store and retrieve aggregated metrics', async () => {
    // Store aggregated metrics
    const now = new Date();
    const hourBucket = new Date(now.setMinutes(0, 0, 0));
    
    await eventRepository.storeAggregatedMetrics(
      'test-metric-1',
      hourBucket,
      '1 hour',
      {
        count: 10,
        sum_value: 150.5,
        min_value: 5.25,
        max_value: 25.75,
        avg_value: 15.05
      }
    );
    
    // Retrieve stored metrics
    const startTime = new Date(hourBucket);
    startTime.setHours(startTime.getHours() - 1);
    
    const endTime = new Date(hourBucket);
    endTime.setHours(endTime.getHours() + 1);
    
    const aggregatedMetrics = await eventRepository.getStoredAggregatedMetrics(
      'test-metric-1',
      '1 hour',
      startTime,
      endTime
    );
    
    expect(aggregatedMetrics).toHaveLength(1);
    expect(aggregatedMetrics[0]).toHaveProperty('metric_id', 'test-metric-1');
    expect(aggregatedMetrics[0]).toHaveProperty('bucket_size', '1 hour');
    expect(aggregatedMetrics[0]).toHaveProperty('count', 10);
    expect(parseFloat(aggregatedMetrics[0].sum_value)).toBe(150.5);
    expect(parseFloat(aggregatedMetrics[0].min_value)).toBe(5.25);
    expect(parseFloat(aggregatedMetrics[0].max_value)).toBe(25.75);
    expect(parseFloat(aggregatedMetrics[0].avg_value)).toBe(15.05);
  });
});
