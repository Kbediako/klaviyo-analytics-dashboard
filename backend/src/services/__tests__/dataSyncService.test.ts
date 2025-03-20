import { DataSyncService } from '../dataSyncService';
import { KlaviyoApiClient } from '../klaviyoApiClient';
import { MetricRepository } from '../../repositories/metricRepository';
import { ProfileRepository } from '../../repositories/profileRepository';
import { EventRepository } from '../../repositories/eventRepository';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../klaviyoApiClient');
jest.mock('../../repositories/metricRepository');
jest.mock('../../repositories/profileRepository');
jest.mock('../../repositories/eventRepository');
jest.mock('../../utils/logger');

describe('DataSyncService', () => {
  let service: DataSyncService;
  let mockKlaviyoClient: jest.Mocked<KlaviyoApiClient>;
  let mockMetricRepo: jest.Mocked<MetricRepository>;
  let mockProfileRepo: jest.Mocked<ProfileRepository>;
  let mockEventRepo: jest.Mocked<EventRepository>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mocks
    mockKlaviyoClient = new KlaviyoApiClient('') as jest.Mocked<KlaviyoApiClient>;
    mockMetricRepo = new MetricRepository() as jest.Mocked<MetricRepository>;
    mockProfileRepo = new ProfileRepository() as jest.Mocked<ProfileRepository>;
    mockEventRepo = new EventRepository() as jest.Mocked<EventRepository>;
    
    // Create service instance
    service = new DataSyncService();
    
    // Replace private properties with mocks
    (service as any).klaviyoClient = mockKlaviyoClient;
    (service as any).metricRepo = mockMetricRepo;
    (service as any).profileRepo = mockProfileRepo;
    (service as any).eventRepo = mockEventRepo;
  });
  
  describe('syncMetrics', () => {
    it('should sync metrics successfully', async () => {
      // Mock API response
      const mockResponse = {
        data: [
          {
            id: 'metric-1',
            type: 'metric',
            attributes: {
              name: 'Test Metric',
              created: '2025-01-01T00:00:00Z',
              updated: '2025-01-02T00:00:00Z',
              integration: {
                id: 'int-1',
                name: 'Test Integration',
                category: 'email'
              }
            }
          }
        ]
      };
      
      mockKlaviyoClient.getMetrics.mockResolvedValue(mockResponse);
      mockMetricRepo.createOrUpdate.mockResolvedValue({
        id: 'metric-1',
        name: 'Test Metric',
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date('2025-01-02T00:00:00Z'),
        integration_id: 'int-1',
        integration_name: 'Test Integration',
        integration_category: 'email',
        metadata: {}
      });
      
      // Call the method
      const result = await service.syncMetrics();
      
      // Verify results
      expect(result).toBe(1);
      expect(mockKlaviyoClient.getMetrics).toHaveBeenCalledTimes(1);
      expect(mockMetricRepo.createOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockMetricRepo.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'metric-1',
          name: 'Test Metric',
          created_at: expect.any(Date),
          integration_id: 'int-1',
          integration_name: 'Test Integration',
          integration_category: 'email'
        })
      );
    });
    
    it('should handle empty response', async () => {
      // Mock API response with no data
      mockKlaviyoClient.getMetrics.mockResolvedValue({ data: [] });
      
      // Call the method
      const result = await service.syncMetrics();
      
      // Verify results
      expect(result).toBe(0);
      expect(mockKlaviyoClient.getMetrics).toHaveBeenCalledTimes(1);
      expect(mockMetricRepo.createOrUpdate).not.toHaveBeenCalled();
    });
    
    it('should handle API errors', async () => {
      // Mock API error
      const error = new Error('API error');
      mockKlaviyoClient.getMetrics.mockRejectedValue(error);
      
      // Call the method and expect it to throw
      await expect(service.syncMetrics()).rejects.toThrow('API error');
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'Error syncing metrics:',
        expect.any(Error)
      );
    });
  });
  
  describe('syncRecentEvents', () => {
    it('should sync events successfully', async () => {
      // Mock API response
      const mockResponse = {
        data: [
          {
            id: 'event-1',
            type: 'event',
            attributes: {
              datetime: '2025-01-01T00:00:00Z',
              timestamp: 1735689600,
              value: 10.99,
              properties: { source: 'test' }
            },
            relationships: {
              metric: {
                data: {
                  id: 'metric-1',
                  type: 'metric'
                }
              },
              profile: {
                data: {
                  id: 'profile-1',
                  type: 'profile'
                }
              }
            }
          }
        ],
        included: [
          {
            id: 'profile-1',
            type: 'profile',
            attributes: {
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
              created: '2024-12-01T00:00:00Z',
              properties: {}
            }
          }
        ]
      };
      
      mockKlaviyoClient.getEvents.mockResolvedValue(mockResponse);
      mockProfileRepo.createOrUpdate.mockResolvedValue({
        id: 'profile-1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date('2024-12-01T00:00:00Z'),
        updated_at: new Date(),
        properties: {}
      });
      mockEventRepo.create.mockResolvedValue({
        id: 'event-1',
        metric_id: 'metric-1',
        profile_id: 'profile-1',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        value: 10.99,
        properties: { source: 'test' },
        raw_data: expect.any(Object)
      });
      
      // Call the method
      const result = await service.syncRecentEvents(24);
      
      // Verify results
      expect(result).toBe(1);
      expect(mockKlaviyoClient.getEvents).toHaveBeenCalledTimes(1);
      expect(mockProfileRepo.createOrUpdate).toHaveBeenCalledTimes(1);
      expect(mockEventRepo.create).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('syncAll', () => {
    it('should sync all data types', async () => {
      // Mock individual sync methods
      jest.spyOn(service, 'syncMetrics').mockResolvedValue(5);
      jest.spyOn(service, 'syncProfiles').mockResolvedValue(10);
      jest.spyOn(service, 'syncRecentEvents').mockResolvedValue(20);
      jest.spyOn(service, 'syncCampaigns').mockResolvedValue(3);
      jest.spyOn(service, 'syncFlows').mockResolvedValue(2);
      
      // Call the method
      const result = await service.syncAll();
      
      // Verify results
      expect(result).toEqual({
        metrics: 5,
        profiles: 10,
        events: 20,
        campaigns: 3,
        flows: 2
      });
      
      // Verify all sync methods were called
      expect(service.syncMetrics).toHaveBeenCalledTimes(1);
      expect(service.syncProfiles).toHaveBeenCalledTimes(1);
      expect(service.syncRecentEvents).toHaveBeenCalledWith(48);
      expect(service.syncCampaigns).toHaveBeenCalledTimes(1);
      expect(service.syncFlows).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors during sync', async () => {
      // Mock error in one of the sync methods
      jest.spyOn(service, 'syncMetrics').mockResolvedValue(5);
      jest.spyOn(service, 'syncProfiles').mockRejectedValue(new Error('Profile sync error'));
      
      // Call the method and expect it to throw
      await expect(service.syncAll()).rejects.toThrow('Profile sync error');
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'Error during full data sync:',
        expect.any(Error)
      );
    });
  });
});
