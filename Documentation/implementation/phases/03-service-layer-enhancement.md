# Phase 3: Service Layer Enhancement

## Overview

This phase focused on implementing the service layer that handles data synchronization between Klaviyo's API and our local database, along with data processing and transformation. We implemented the missing repository classes (FlowRepository, FormRepository, SegmentRepository) following the repository pattern, updated the controllers to use a database-first approach, and added sync endpoints for all entity types.

## Timeline

- Week 5: Data Sync Service Implementation
- Week 6: Controller Layer Updates

## Implementation Details

### 3.1 Database Migrations

We created database migration files for the following tables:

1. `klaviyo_flows` - Stores flow data including metrics like recipient count, open/click rates
2. `klaviyo_forms` - Stores form data including views, submissions, and conversions
3. `klaviyo_segments` - Stores segment data including member counts, conversion rates, and revenue
4. `klaviyo_sync_status` - Tracks the last sync time for each entity type

Example migration file for the segments table:

```sql
-- 007_segments_schema.sql
CREATE TABLE klaviyo_segments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  member_count INTEGER DEFAULT 0,
  active_count INTEGER DEFAULT 0, 
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  created_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB
);

-- Create indexes for common queries
CREATE INDEX idx_klaviyo_segments_status ON klaviyo_segments (status);
CREATE INDEX idx_klaviyo_segments_name ON klaviyo_segments (name);
CREATE INDEX idx_klaviyo_segments_created_date ON klaviyo_segments (created_date DESC);
CREATE INDEX idx_klaviyo_segments_updated_at ON klaviyo_segments (updated_at DESC);
```

### 3.2 Repository Pattern Implementation

We implemented repository classes for flows, forms, and segments following a consistent pattern:

```typescript
// Repository Interface Pattern
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findByName(name: string): Promise<T[]>;
  findByStatus(status: string): Promise<T[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<T[]>;
  create(item: Omit<T, 'created_at' | 'updated_at'>): Promise<T>;
  createOrUpdate(item: Omit<T, 'updated_at'>): Promise<T>;
  delete(id: string): Promise<boolean>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  createBatch(items: Omit<T, 'created_at' | 'updated_at'>[]): Promise<T[]>;
  findUpdatedSince(since: Date): Promise<T[]>;
  getLatestUpdateTimestamp(): Promise<Date | null>;
}
```

Each repository includes:
- CRUD operations (create, read, update, delete)
- Batch operations for efficient data insertion
- Search methods with various filters
- Sync-related methods to support incremental sync

### 3.3 Data Sync Service

We enhanced the DataSyncService to support all entity types and implemented incremental sync:

```typescript
export class DataSyncService {
  /**
   * Sync all entity types
   * @param options Sync options
   * @returns Sync result
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    const entityTypes = options.entityTypes || ['campaigns', 'flows', 'forms', 'segments'];
    
    logger.info(`Starting sync for entities: ${entityTypes.join(', ')}${options.force ? ' (forced)' : ''}`);
    
    // Run sync for each entity type
    const syncPromises = entityTypes.map(async (entityType) => {
      try {
        switch (entityType) {
          case 'campaigns':
            result.entityResults.campaigns = await this.syncCampaigns(options);
            break;
          case 'flows':
            result.entityResults.flows = await this.syncFlows(options);
            break;
          case 'forms':
            result.entityResults.forms = await this.syncForms(options);
            break;
          case 'segments':
            result.entityResults.segments = await this.syncSegments(options);
            break;
        }
      } catch (error) {
        // Error handling...
      }
    });
    
    // Wait for all sync operations to complete
    await Promise.all(syncPromises);
    
    return result;
  }
}
```

Key features of the sync service:
- Support for both full and incremental syncs
- Database timestamp tracking for efficient data updates
- Proper error handling and retry mechanisms
- Status tracking for monitoring sync operations

### 3.4 Controller Implementation (Database-First Approach)

We updated all controllers to follow a database-first approach:

```typescript
export async function getSegments(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Try to get data from the database first
    const segments = await segmentRepository.findByDateRange(dateRange.startDate, dateRange.endDate);
    
    // If we have data in the database, transform and return it
    if (segments.length > 0) {
      logger.info(`Retrieved ${segments.length} segments from database`);
      
      // Transform data for frontend
      const transformedSegments = segments.map(segment => ({
        id: segment.id,
        name: segment.name,
        count: segment.member_count || 0,
        conversionRate: segment.conversion_rate || 0,
        revenue: segment.revenue || 0
      }));
      
      return res.status(200).json(transformedSegments);
    }
    
    // If not found in database, fetch from API
    logger.info('No segments found in database, fetching from API');
    const apiSegments = await getSegmentsData(dateRange);
    
    // Store in database for future requests
    if (apiSegments.length > 0) {
      try {
        const dbSegments = apiSegments.map(segment => ({
          id: segment.id,
          name: segment.name,
          status: 'active',
          member_count: segment.count || 0,
          conversion_rate: segment.conversionRate || 0,
          revenue: segment.revenue || 0,
          created_date: new Date(),
          metadata: { source: 'api' }
        }));
        
        await segmentRepository.createBatch(dbSegments);
        logger.info(`Stored ${dbSegments.length} segments in database`);
      } catch (dbError) {
        logger.error('Error storing segments in database:', dbError);
      }
    }
    
    // Return API data
    return res.status(200).json(apiSegments);
  } catch (error) {
    // Error handling...
  }
}
```

### 3.5 API Routes for Sync Operations

We added new endpoints for manually triggering sync operations:

```typescript
/**
 * @route   POST /api/segments/sync
 * @desc    Sync segments data from Klaviyo API to database
 * @query   force - Whether to force a full sync (optional, default: false)
 * @access  Public
 */
router.post('/sync', syncSegments);
```

These endpoints are excluded from caching middleware:

```typescript
// Special handling for segments routes to exclude sync endpoint from caching
app.use('/api/segments/sync', segmentsRoutes);
app.use('/api/segments', cacheMiddleware(CACHE_TTLS.segments), segmentsRoutes);
```

### 3.6 Comprehensive Testing

We created comprehensive test suites for all repositories:

```typescript
describe('SegmentRepository', () => {
  // Mock data setup...
  
  describe('findById', () => {
    it('should find a segment by id', async () => {
      // Test logic...
    });

    it('should return null if segment not found', async () => {
      // Test logic...
    });
  });

  describe('createBatch', () => {
    it('should create multiple segments in a transaction', async () => {
      // Test logic...
    });

    it('should rollback transaction on error', async () => {
      // Test logic...
    });
  });
  
  // Additional tests...
});
```

## Success Criteria

- [x] Repository implementations for all entity types (flows, forms, segments)
- [x] Data sync service successfully fetches and stores data from Klaviyo API
- [x] Incremental sync functionality implemented and working correctly
- [x] Controllers using local database first, falling back to API when needed
- [x] Manual sync endpoints implemented for all entity types
- [x] All unit tests passing
- [x] Error handling and logging implemented
- [x] Performance metrics collected for sync operations

## Next Steps

After completing this phase:
1. Implement the Analytics Engine in Phase 4
2. Enhance frontend integration to use the new endpoints
3. Add additional chart and visualization components
4. Implement advanced filtering and segmentation capabilities
5. Test the application with production-like data volumes