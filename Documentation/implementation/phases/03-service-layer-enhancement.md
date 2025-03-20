# Phase 3: Service Layer Enhancement (Weeks 5-6)

## Overview

This phase focuses on implementing the service layer that handles data synchronization between Klaviyo's API and our local database, along with data processing and transformation.

## Timeline

- Week 5: Data Sync Service Implementation
- Week 6: Controller Layer Updates

## Implementation Details

### 3.1 Implement Data Sync Service (Week 5)

```typescript
// backend/src/services/dataSyncService.ts
import { KlaviyoApiClient } from './klaviyoApiClient';
import { MetricRepository } from '../repositories/metricRepository';
import { ProfileRepository } from '../repositories/profileRepository';
import { EventRepository } from '../repositories/eventRepository';

export class DataSyncService {
  private klaviyoClient: KlaviyoApiClient;
  private metricRepo: MetricRepository;
  private profileRepo: ProfileRepository;
  private eventRepo: EventRepository;
  
  constructor() {
    this.klaviyoClient = new KlaviyoApiClient(process.env.KLAVIYO_API_KEY || '');
    this.metricRepo = new MetricRepository();
    this.profileRepo = new ProfileRepository();
    this.eventRepo = new EventRepository();
  }
  
  async syncMetrics(): Promise<void> {
    try {
      // Fetch all metrics from Klaviyo
      const response = await this.klaviyoClient.get('/api/metrics', {
        fields: {
          metric: ['name', 'created', 'updated', 'integration']
        },
        page: { size: 100 }
      });
      
      // Process and store each metric
      const metrics = response.data;
      for (const metric of metrics) {
        await this.metricRepo.createOrUpdate({
          id: metric.id,
          name: metric.attributes.name,
          created_at: new Date(metric.attributes.created),
          integration_id: metric.attributes.integration?.id,
          integration_name: metric.attributes.integration?.name,
          integration_category: metric.attributes.integration?.category,
          metadata: metric.attributes
        });
      }
      
      // Handle pagination if needed
      if (response.links && response.links.next) {
        // Fetch next page...
      }
      
      console.log(`Synced ${metrics.length} metrics successfully`);
    } catch (error) {
      console.error('Error syncing metrics:', error);
      throw error;
    }
  }
  
  async syncRecentEvents(hours: number = 24): Promise<void> {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
      
      // Format dates for Klaviyo API
      const startString = startDate.toISOString();
      const endString = now.toISOString();
      
      const response = await this.klaviyoClient.get('/api/events', {
        filter: [
          { field: 'datetime', operator: 'greater-or-equal', value: startString },
          { field: 'datetime', operator: 'less-or-equal', value: endString }
        ],
        sort: ['-datetime'],
        include: ['profile', 'metric'],
        fields: {
          event: ['datetime', 'timestamp', 'event_properties', 'value', 'uuid'],
          profile: ['email', 'phone_number', 'first_name', 'last_name'],
          metric: ['name', 'integration']
        },
        page: { size: 100 }
      });
      
      // Process and store events
      for (const event of response.data) {
        // Store profile if it doesn't exist
        if (event.relationships.profile) {
          await this.profileRepo.createOrUpdate({
            id: event.relationships.profile.data.id,
            ...event.relationships.profile.attributes
          });
        }
        
        // Store event
        await this.eventRepo.create({
          id: event.id,
          metric_id: event.relationships.metric.data.id,
          profile_id: event.relationships.profile.data.id,
          timestamp: new Date(event.attributes.datetime),
          value: event.attributes.value,
          properties: event.attributes.event_properties,
          raw_data: event
        });
      }
      
      console.log(`Synced ${response.data.length} events from the last ${hours} hours`);
    } catch (error) {
      console.error('Error syncing recent events:', error);
      throw error;
    }
  }
}
```

### 3.2 Create Scheduler for Regular Sync (Week 5)

```typescript
// backend/src/scheduler/index.ts
import cron from 'node-cron';
import { DataSyncService } from '../services/dataSyncService';

export class SyncScheduler {
  private dataSyncService: DataSyncService;
  
  constructor() {
    this.dataSyncService = new DataSyncService();
  }
  
  start(): void {
    // Sync metrics daily at 1 AM
    cron.schedule('0 1 * * *', async () => {
      console.log('Running metrics sync job...');
      try {
        await this.dataSyncService.syncMetrics();
        console.log('Metrics sync completed');
      } catch (error) {
        console.error('Metrics sync failed:', error);
      }
    });
    
    // Sync recent events every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly events sync...');
      try {
        await this.dataSyncService.syncRecentEvents(2); // Overlap by 1 hour
        console.log('Events sync completed');
      } catch (error) {
        console.error('Events sync failed:', error);
      }
    });
  }
}
```

### 3.3 Update Controller Layer (Week 6)

```typescript
// backend/src/controllers/campaignsController.ts
import { Request, Response } from 'express';
import { CampaignService } from '../services/campaignService';
import { parseDateRange } from '../utils/dateUtils';

export class CampaignsController {
  private campaignService: CampaignService;
  
  constructor() {
    this.campaignService = new CampaignService();
  }
  
  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const dateRange = parseDateRange(req.query.dateRange as string);
      
      // Check DB first
      const campaignsFromDb = await this.campaignService.getCampaignsFromDb(dateRange);
      
      if (campaignsFromDb.length > 0) {
        res.json(campaignsFromDb);
        return;
      }
      
      // If no data in DB, fetch from API
      const campaigns = await this.campaignService.getCampaignsData(dateRange);
      
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }
}
```

## Testing

### Unit Tests for Data Sync Service

```typescript
// backend/src/services/__tests__/dataSyncService.test.ts
import { DataSyncService } from '../dataSyncService';
import { KlaviyoApiClient } from '../klaviyoApiClient';
import { MetricRepository } from '../../repositories/metricRepository';

jest.mock('../klaviyoApiClient');
jest.mock('../../repositories/metricRepository');

describe('DataSyncService', () => {
  let service: DataSyncService;
  let mockKlaviyoClient: jest.Mocked<KlaviyoApiClient>;
  let mockMetricRepo: jest.Mocked<MetricRepository>;
  
  beforeEach(() => {
    mockKlaviyoClient = new KlaviyoApiClient('') as jest.Mocked<KlaviyoApiClient>;
    mockMetricRepo = new MetricRepository() as jest.Mocked<MetricRepository>;
    service = new DataSyncService();
  });
  
  it('should sync metrics successfully', async () => {
    const mockMetrics = {
      data: [
        {
          id: 'metric-1',
          attributes: {
            name: 'Test Metric',
            created: '2025-01-01T00:00:00Z',
            integration: {
              id: 'int-1',
              name: 'Test Integration',
              category: 'test'
            }
          }
        }
      ]
    };
    
    mockKlaviyoClient.get.mockResolvedValueOnce(mockMetrics);
    
    await service.syncMetrics();
    
    expect(mockMetricRepo.createOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'metric-1',
        name: 'Test Metric'
      })
    );
  });
});
```

## Success Criteria

- [ ] Data sync service successfully fetches and stores data from Klaviyo API
- [ ] Scheduled jobs running correctly and handling errors appropriately
- [ ] Controllers using local database first, falling back to API when needed
- [ ] All unit tests passing
- [ ] Error handling and logging implemented
- [ ] Performance metrics collected for sync operations

## Next Steps

After completing this phase:
1. Monitor sync job performance and adjust schedules if needed
2. Review error handling and recovery procedures
3. Begin implementing analytics engine in Phase 4
4. Plan frontend integration updates
