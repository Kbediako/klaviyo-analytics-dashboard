import { DataSyncService } from '../dataSyncService';
import { klaviyoApiClient } from '../klaviyoApiClient';
import { db } from '../../database';
import campaignRepository from '../../repositories/campaignRepository';
import { flowRepository } from '../../repositories/flowRepository';

// Mock the dependencies
jest.mock('../klaviyoApiClient', () => ({
  klaviyoApiClient: {
    getCampaigns: jest.fn(),
    getFlows: jest.fn()
  }
}));

jest.mock('../../database', () => ({
  db: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    transaction: jest.fn().mockImplementation(async (callback) => callback({ query: jest.fn().mockResolvedValue({ rows: [] }) }))
  }
}));

jest.mock('../../repositories/campaignRepository', () => ({
  __esModule: true,
  default: {
    createBatch: jest.fn()
  }
}));

jest.mock('../../repositories/flowRepository', () => ({
  flowRepository: {
    createBatch: jest.fn(),
    findUpdatedSince: jest.fn(),
    getLatestUpdateTimestamp: jest.fn()
  }
}));

describe('DataSyncService', () => {
  let dataSyncService: DataSyncService;
  
  beforeEach(() => {
    dataSyncService = new DataSyncService();
    jest.clearAllMocks();
  });
  
  describe('syncCampaigns', () => {
    it('should successfully sync campaigns', async () => {
      // Mock API response
      const mockApiResponse = {
        data: [
          {
            id: 'campaign-1',
            attributes: {
              name: 'Test Campaign 1',
              status: 'sent',
              send_time: '2023-01-01T00:00:00Z',
              metrics: {
                sent_count: '1000',
                open_count: '500',
                click_count: '250',
                conversion_count: '100',
                revenue: '5000'
              }
            }
          },
          {
            id: 'campaign-2',
            attributes: {
              name: 'Test Campaign 2',
              status: 'draft'
            }
          }
        ]
      };
      
      // Mock the repository response
      const mockCreatedCampaigns = [
        { id: 'campaign-1', name: 'Test Campaign 1' },
        { id: 'campaign-2', name: 'Test Campaign 2' }
      ];
      
      // Setup mocks
      (klaviyoApiClient.getCampaigns as jest.Mock).mockResolvedValue(mockApiResponse);
      (campaignRepository.createBatch as jest.Mock).mockResolvedValue(mockCreatedCampaigns);
      
      // Call the method
      const result = await dataSyncService.syncCampaigns();
      
      // Verify API was called
      expect(klaviyoApiClient.getCampaigns).toHaveBeenCalledTimes(1);
      
      // Verify repository was called with transformed data
      expect(campaignRepository.createBatch).toHaveBeenCalledTimes(1);
      const createBatchArg = (campaignRepository.createBatch as jest.Mock).mock.calls[0][0];
      
      // Verify the transformed data structure
      expect(createBatchArg).toHaveLength(2);
      expect(createBatchArg[0].id).toBe('campaign-1');
      expect(createBatchArg[0].name).toBe('Test Campaign 1');
      expect(createBatchArg[0].status).toBe('sent');
      expect(createBatchArg[0].sent_count).toBe(1000);
      expect(createBatchArg[0].revenue).toBe(5000);
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
    
    it('should handle API error response', async () => {
      // Mock API error
      (klaviyoApiClient.getCampaigns as jest.Mock).mockResolvedValue(null);
      
      // Call the method
      const result = await dataSyncService.syncCampaigns();
      
      // Verify API was called
      expect(klaviyoApiClient.getCampaigns).toHaveBeenCalledTimes(1);
      
      // Verify repository was not called
      expect(campaignRepository.createBatch).not.toHaveBeenCalled();
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
    });
  });
  
  describe('syncFlows', () => {
    it('should successfully sync flows', async () => {
      // Mock API response
      const mockApiResponse = {
        data: [
          {
            id: 'flow-1',
            attributes: {
              name: 'Welcome Flow',
              status: 'active',
              trigger_type: 'list',
              created_at: '2023-01-01T00:00:00Z',
              metrics: {
                recipient_count: '1000',
                open_count: '800',
                click_count: '400',
                conversion_count: '200',
                revenue: '5000'
              }
            }
          },
          {
            id: 'flow-2',
            attributes: {
              name: 'Abandoned Cart Flow',
              status: 'active',
              trigger_type: 'event'
            }
          }
        ]
      };
      
      // Mock the repository response
      const mockCreatedFlows = [
        { id: 'flow-1', name: 'Welcome Flow' },
        { id: 'flow-2', name: 'Abandoned Cart Flow' }
      ];
      
      // Setup mocks
      (klaviyoApiClient.getFlows as jest.Mock).mockResolvedValue(mockApiResponse);
      (flowRepository.createBatch as jest.Mock).mockResolvedValue(mockCreatedFlows);
      
      // Call the method
      const result = await dataSyncService.syncFlows();
      
      // Verify API was called
      expect(klaviyoApiClient.getFlows).toHaveBeenCalledTimes(1);
      
      // Verify repository was called with transformed data
      expect(flowRepository.createBatch).toHaveBeenCalledTimes(1);
      const createBatchArg = (flowRepository.createBatch as jest.Mock).mock.calls[0][0];
      
      // Verify the transformed data structure
      expect(createBatchArg).toHaveLength(2);
      expect(createBatchArg[0].id).toBe('flow-1');
      expect(createBatchArg[0].name).toBe('Welcome Flow');
      expect(createBatchArg[0].status).toBe('active');
      expect(createBatchArg[0].trigger_type).toBe('list');
      expect(createBatchArg[0].recipient_count).toBe(1000);
      expect(createBatchArg[0].open_count).toBe(800);
      expect(createBatchArg[0].revenue).toBe(5000);
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
    
    it('should handle API error response', async () => {
      // Mock API error
      (klaviyoApiClient.getFlows as jest.Mock).mockResolvedValue(null);
      
      // Call the method
      const result = await dataSyncService.syncFlows();
      
      // Verify API was called
      expect(klaviyoApiClient.getFlows).toHaveBeenCalledTimes(1);
      
      // Verify repository was not called
      expect(flowRepository.createBatch).not.toHaveBeenCalled();
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
    });
  });
  
  describe('syncAll', () => {
    it('should sync all entity types', async () => {
      // Mock individual sync methods
      jest.spyOn(dataSyncService, 'syncCampaigns').mockResolvedValue({
        success: true,
        count: 10,
        message: 'Successfully synced 10 campaigns'
      });
      
      jest.spyOn(dataSyncService, 'syncFlows').mockResolvedValue({
        success: true,
        count: 5,
        message: 'Successfully synced 5 flows'
      });
      
      // Call the method with only campaigns and flows
      const result = await dataSyncService.syncAll({
        entityTypes: ['campaigns', 'flows']
      });
      
      // Verify individual sync methods were called
      expect(dataSyncService.syncCampaigns).toHaveBeenCalledTimes(1);
      expect(dataSyncService.syncFlows).toHaveBeenCalledTimes(1);
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.entityResults.campaigns).toBeDefined();
      expect(result.entityResults.campaigns.success).toBe(true);
      expect(result.entityResults.campaigns.count).toBe(10);
      
      expect(result.entityResults.flows).toBeDefined();
      expect(result.entityResults.flows.success).toBe(true);
      expect(result.entityResults.flows.count).toBe(5);
      
      expect(result.errors).toHaveLength(0);
    });
    
    it('should handle errors in individual sync operations', async () => {
      // Mock individual sync methods
      jest.spyOn(dataSyncService, 'syncCampaigns').mockResolvedValue({
        success: true,
        count: 10,
        message: 'Successfully synced 10 campaigns'
      });
      
      jest.spyOn(dataSyncService, 'syncFlows').mockRejectedValue(new Error('API error'));
      
      // Call the method
      const result = await dataSyncService.syncAll({
        entityTypes: ['campaigns', 'flows']
      });
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.entityResults.campaigns).toBeDefined();
      expect(result.entityResults.campaigns.success).toBe(true);
      
      expect(result.entityResults.flows).toBeDefined();
      expect(result.entityResults.flows.success).toBe(false);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('API error');
    });
  });
  
  describe('Sync tracking and status', () => {
    it('should track sync timestamp correctly', async () => {
      // Setup
      const timestamp = new Date();
      const entityType = 'flows';
      const status = 'synced';
      const recordCount = 10;
      const success = true;
      
      // Mock db.query to return successful result
      (db.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
      
      // Call the method
      await dataSyncService.trackSyncTimestamp(entityType, timestamp, status, recordCount, success);
      
      // Verify db query was called with correct parameters
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE klaviyo_sync_status'),
        [timestamp, status, recordCount, success, null, entityType]
      );
    });
    
    it('should get last sync timestamp correctly', async () => {
      // Setup
      const mockTimestamp = new Date();
      
      // Mock db.query to return a sync record
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          last_sync_time: mockTimestamp,
          status: 'synced',
          success: true
        }]
      });
      
      // Call the method
      const result = await dataSyncService.getLastSyncTimestamp('flows');
      
      // Verify db query was called correctly
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT last_sync_time'),
        ['flows']
      );
      
      // Verify result
      expect(result).toEqual(mockTimestamp);
    });
    
    it('should return null when sync was not successful', async () => {
      // Mock db.query to return a failed sync record
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          last_sync_time: new Date(),
          status: 'failed',
          success: false
        }]
      });
      
      // Call the method
      const result = await dataSyncService.getLastSyncTimestamp('flows');
      
      // Verify result
      expect(result).toBeNull();
    });
    
    it('should return sync status for all entity types', async () => {
      // Mock db.query to return multiple sync records
      const mockRecords = [
        {
          entity_type: 'campaigns',
          last_sync_time: new Date('2023-01-01'),
          status: 'synced',
          record_count: 10,
          success: true,
          error_message: null
        },
        {
          entity_type: 'flows',
          last_sync_time: new Date('2023-01-02'),
          status: 'synced',
          record_count: 5,
          success: true,
          error_message: null
        },
        {
          entity_type: 'forms',
          last_sync_time: null,
          status: 'not_synced',
          record_count: 0,
          success: false,
          error_message: 'Not implemented'
        }
      ];
      
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: mockRecords
      });
      
      // Call the method
      const result = await dataSyncService.getSyncStatus();
      
      // Verify result
      expect(result.campaigns).toBeDefined();
      expect(result.campaigns.lastSyncTime).toEqual(mockRecords[0].last_sync_time);
      expect(result.campaigns.status).toBe('synced');
      
      expect(result.flows).toBeDefined();
      expect(result.flows.lastSyncTime).toEqual(mockRecords[1].last_sync_time);
      
      expect(result.forms).toBeDefined();
      expect(result.forms.success).toBe(false);
    });
  });
  
  describe('Incremental sync', () => {
    it('should perform incremental sync when last sync timestamp exists', async () => {
      // Setup
      const lastSyncTime = new Date('2023-01-01');
      
      // Mock getLastSyncTimestamp to return a timestamp
      jest.spyOn(dataSyncService, 'getLastSyncTimestamp').mockResolvedValueOnce(lastSyncTime);
      
      // Mock API response with updated_at timestamps for filtering
      const mockApiResponse = {
        data: [
          {
            id: 'flow-1',
            attributes: {
              name: 'Welcome Flow',
              status: 'active',
              updated_at: '2023-01-02T00:00:00Z', // After last sync
              metrics: { recipient_count: '1000' }
            }
          },
          {
            id: 'flow-2',
            attributes: {
              name: 'Abandoned Cart Flow',
              status: 'active',
              updated_at: '2022-12-01T00:00:00Z' // Before last sync
            }
          }
        ]
      };
      
      // Mock other dependencies
      (klaviyoApiClient.getFlows as jest.Mock).mockResolvedValueOnce(mockApiResponse);
      (flowRepository.createBatch as jest.Mock).mockResolvedValueOnce([{ id: 'flow-1' }]);
      
      // Mock trackSyncTimestamp to do nothing
      jest.spyOn(dataSyncService, 'trackSyncTimestamp').mockResolvedValueOnce();
      
      // Call the method - should use incremental sync
      const result = await dataSyncService.syncFlows();
      
      // Verify correct flow was synced (only the one with newer timestamp)
      expect(flowRepository.createBatch).toHaveBeenCalledTimes(1);
      const createBatchArg = (flowRepository.createBatch as jest.Mock).mock.calls[0][0];
      expect(createBatchArg).toHaveLength(1);
      expect(createBatchArg[0].id).toBe('flow-1');
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });
    
    it('should perform full sync when force option is true', async () => {
      // Setup a timestamp, but it should be ignored because force=true
      const lastSyncTime = new Date('2023-01-01');
      
      // Mock getLastSyncTimestamp to return a timestamp
      jest.spyOn(dataSyncService, 'getLastSyncTimestamp').mockResolvedValueOnce(lastSyncTime);
      
      // Mock API response
      const mockApiResponse = {
        data: [
          {
            id: 'flow-1',
            attributes: {
              name: 'Welcome Flow',
              status: 'active',
              updated_at: '2023-01-02T00:00:00Z', // After last sync
              metrics: { recipient_count: '1000' }
            }
          },
          {
            id: 'flow-2',
            attributes: {
              name: 'Abandoned Cart Flow',
              status: 'active',
              updated_at: '2022-12-01T00:00:00Z' // Before last sync
            }
          }
        ]
      };
      
      // Mock other dependencies
      (klaviyoApiClient.getFlows as jest.Mock).mockResolvedValueOnce(mockApiResponse);
      (flowRepository.createBatch as jest.Mock).mockResolvedValueOnce([{ id: 'flow-1' }, { id: 'flow-2' }]);
      
      // Mock trackSyncTimestamp to do nothing
      jest.spyOn(dataSyncService, 'trackSyncTimestamp').mockResolvedValueOnce();
      
      // Call the method with force option
      const result = await dataSyncService.syncFlows({ force: true });
      
      // Verify both flows were synced (full sync)
      expect(flowRepository.createBatch).toHaveBeenCalledTimes(1);
      const createBatchArg = (flowRepository.createBatch as jest.Mock).mock.calls[0][0];
      expect(createBatchArg).toHaveLength(2);
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
  });
});
