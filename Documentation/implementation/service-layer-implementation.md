# Service Layer Implementation

This document outlines the implementation of the service layer for the Klaviyo Analytics Dashboard, focusing on data synchronization between Klaviyo's API and our local database.

## Overview

The service layer enhancement provides:

1. **Data Synchronization**: Regular syncing of data from Klaviyo API to local database
2. **Scheduled Jobs**: Automated data refresh at configurable intervals
3. **Database-First Approach**: Controllers now check local database before making API calls
4. **Performance Metrics**: Tracking of sync operations for monitoring

## Components

### 1. Data Sync Service

The `DataSyncService` class handles synchronization of various data types from Klaviyo to our local database:

```typescript
// backend/src/services/dataSyncService.ts
export class DataSyncService {
  // Methods for syncing different entity types
  async syncMetrics(): Promise<number> { /* ... */ }
  async syncRecentEvents(hours: number = 24): Promise<number> { /* ... */ }
  async syncCampaigns(): Promise<number> { /* ... */ }
  async syncFlows(): Promise<number> { /* ... */ }
  async syncProfiles(): Promise<number> { /* ... */ }
  async syncAll(): Promise<Record<string, number>> { /* ... */ }
}
```

Each sync method:
- Fetches data from Klaviyo API
- Transforms it to match our database schema
- Stores it in the appropriate repository
- Returns the count of synced items
- Includes error handling and logging

### 2. Scheduler

The `SyncScheduler` class manages scheduled jobs for regular data synchronization:

```typescript
// backend/src/scheduler/index.ts
export class SyncScheduler {
  // Schedule configuration
  start(): void {
    // Metrics: daily at 1 AM
    // Events: hourly
    // Campaigns: every 3 hours
    // Flows: every 6 hours
    // Profiles: daily at 2 AM
  }
  
  // Manual trigger for jobs
  async runJobNow(jobType: 'metrics' | 'events' | 'campaigns' | 'flows' | 'profiles'): Promise<void> { /* ... */ }
}
```

### 3. Repositories

Repository classes provide database access for each entity type:

- `MetricRepository`: Manages Klaviyo metrics
- `ProfileRepository`: Manages customer profiles
- `EventRepository`: Manages Klaviyo events
- `CampaignRepository`: Manages campaign data

Each repository implements:
- CRUD operations
- Batch operations
- Query methods
- Aggregation functions

### 4. Controllers

Controllers have been updated to use a database-first approach:

```typescript
// backend/src/controllers/campaignsController.ts
export async function getCampaigns(req: Request, res: Response) {
  // Try to get campaigns from database first
  const campaignsFromDb = await getCampaignsFromDb(dateRange);
  
  if (campaignsFromDb.length > 0) {
    // Return data from database if available
    return res.status(200).json(campaignsFromDb);
  }
  
  // Fall back to API if no data in database
  const campaigns = await getCampaignsData(dateRange);
  
  // Trigger background sync for future requests
  setTimeout(() => {
    dataSyncService.syncCampaigns()
      .then(count => logger.info(`Background sync completed: ${count} campaigns synced`))
      .catch(err => logger.error('Background sync failed:', err));
  }, 100);
  
  return res.status(200).json(campaigns);
}
```

### 5. Database Schema

New tables have been added to support data persistence:

- `klaviyo_metrics`: Stores metric definitions
- `klaviyo_profiles`: Stores customer profiles
- `klaviyo_events`: Stores event data with time-series optimization
- `klaviyo_campaigns`: Stores campaign data
- `klaviyo_aggregated_metrics`: Stores pre-aggregated metrics for faster queries

## Performance Considerations

1. **Caching Strategy**:
   - API responses are cached for configurable TTLs
   - Sync endpoints bypass caching
   - Cache is invalidated after sync operations

2. **Database Optimization**:
   - Indexes on frequently queried fields
   - TimescaleDB for time-series data
   - Pre-aggregated metrics for common queries

3. **Background Processing**:
   - Sync operations run in the background
   - API responses are returned immediately from cache or API
   - Database is updated asynchronously

## Monitoring

Performance metrics are collected for sync operations:
- Duration of sync operations
- Number of items synced
- Error rates
- API call counts

## API Endpoints

New endpoints have been added for manual sync operations:

- `POST /api/campaigns/sync`: Manually trigger campaign sync
- (Future) `POST /api/metrics/sync`: Manually trigger metrics sync
- (Future) `POST /api/events/sync`: Manually trigger events sync
- (Future) `POST /api/profiles/sync`: Manually trigger profiles sync
- (Future) `POST /api/sync/all`: Trigger full data sync

## Future Enhancements

1. **Incremental Sync**:
   - Only sync data that has changed since last sync
   - Use Klaviyo API's modified_since parameter

2. **Webhook Integration**:
   - Subscribe to Klaviyo webhooks for real-time updates
   - Process webhook events to update database

3. **Advanced Caching**:
   - Implement Redis for distributed caching
   - Add cache warming for common queries

4. **Sync Status Dashboard**:
   - Admin UI for monitoring sync status
   - Manual sync triggers
   - Sync history and logs
