import { DataSyncService } from '../dataSyncService';
import { klaviyoApiClient } from '../klaviyoApiClient';
import campaignRepository from '../../repositories/campaignRepository';
import { flowRepository } from '../../repositories/flowRepository';

// Mock the dependencies
jest.mock('../klaviyoApiClient', () => ({
  klaviyoApiClient: {
    getCampaigns: jest.fn(),
    getFlows: jest.fn()
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
    createBatch: jest.fn()
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
});
