import cron from 'node-cron';
import { DataSyncService } from '../services/dataSyncService';
import { logger } from '../utils/logger';

/**
 * Scheduler for managing data synchronization jobs
 */
export class SyncScheduler {
  private dataSyncService: DataSyncService;
  private activeJobs: Map<string, cron.ScheduledTask> = new Map();
  
  /**
   * Create a new sync scheduler
   */
  constructor() {
    this.dataSyncService = new DataSyncService();
  }
  
  /**
   * Start all scheduled sync jobs
   */
  start(): void {
    this.scheduleMetricsSync();
    this.scheduleEventsSync();
    this.scheduleCampaignsSync();
    this.scheduleFlowsSync();
    this.scheduleProfilesSync();
    
    logger.info('All sync jobs scheduled successfully');
  }
  
  /**
   * Stop all scheduled sync jobs
   */
  stop(): void {
    for (const [jobName, job] of this.activeJobs.entries()) {
      job.stop();
      logger.info(`Stopped sync job: ${jobName}`);
    }
    
    this.activeJobs.clear();
    logger.info('All sync jobs stopped');
  }
  
  /**
   * Schedule metrics sync job (daily at 1 AM)
   */
  private scheduleMetricsSync(): void {
    const jobName = 'metrics-sync';
    const job = cron.schedule('0 1 * * *', async () => {
      logger.info('Running metrics sync job...');
      const startTime = Date.now();
      
      try {
        await this.dataSyncService.syncMetrics();
        
        const duration = Date.now() - startTime;
        logger.info(`Metrics sync completed in ${duration}ms`);
      } catch (error) {
        logger.error('Metrics sync failed:', error);
      }
    });
    
    this.activeJobs.set(jobName, job);
    logger.info(`Scheduled job: ${jobName} (daily at 1 AM)`);
  }
  
  /**
   * Schedule events sync job (hourly)
   */
  private scheduleEventsSync(): void {
    const jobName = 'events-sync';
    const job = cron.schedule('0 * * * *', async () => {
      logger.info('Running hourly events sync...');
      const startTime = Date.now();
      
      try {
        // Overlap by 1 hour to ensure no events are missed
        await this.dataSyncService.syncRecentEvents(2);
        
        const duration = Date.now() - startTime;
        logger.info(`Events sync completed in ${duration}ms`);
      } catch (error) {
        logger.error('Events sync failed:', error);
      }
    });
    
    this.activeJobs.set(jobName, job);
    logger.info(`Scheduled job: ${jobName} (hourly)`);
  }
  
  /**
   * Schedule campaigns sync job (every 3 hours)
   */
  private scheduleCampaignsSync(): void {
    const jobName = 'campaigns-sync';
    const job = cron.schedule('0 */3 * * *', async () => {
      logger.info('Running campaigns sync job...');
      const startTime = Date.now();
      
      try {
        await this.dataSyncService.syncCampaigns();
        
        const duration = Date.now() - startTime;
        logger.info(`Campaigns sync completed in ${duration}ms`);
      } catch (error) {
        logger.error('Campaigns sync failed:', error);
      }
    });
    
    this.activeJobs.set(jobName, job);
    logger.info(`Scheduled job: ${jobName} (every 3 hours)`);
  }
  
  /**
   * Schedule flows sync job (every 6 hours)
   */
  private scheduleFlowsSync(): void {
    const jobName = 'flows-sync';
    const job = cron.schedule('0 */6 * * *', async () => {
      logger.info('Running flows sync job...');
      const startTime = Date.now();
      
      try {
        await this.dataSyncService.syncFlows();
        
        const duration = Date.now() - startTime;
        logger.info(`Flows sync completed in ${duration}ms`);
      } catch (error) {
        logger.error('Flows sync failed:', error);
      }
    });
    
    this.activeJobs.set(jobName, job);
    logger.info(`Scheduled job: ${jobName} (every 6 hours)`);
  }
  
  /**
   * Schedule profiles sync job (daily at 2 AM)
   */
  private scheduleProfilesSync(): void {
    const jobName = 'profiles-sync';
    const job = cron.schedule('0 2 * * *', async () => {
      logger.info('Running profiles sync job...');
      const startTime = Date.now();
      
      try {
        await this.dataSyncService.syncProfiles();
        
        const duration = Date.now() - startTime;
        logger.info(`Profiles sync completed in ${duration}ms`);
      } catch (error) {
        logger.error('Profiles sync failed:', error);
      }
    });
    
    this.activeJobs.set(jobName, job);
    logger.info(`Scheduled job: ${jobName} (daily at 2 AM)`);
  }
  
  /**
   * Run a sync job immediately
   * @param jobType Type of job to run
   */
  async runJobNow(jobType: 'metrics' | 'events' | 'campaigns' | 'flows' | 'profiles'): Promise<void> {
    logger.info(`Running ${jobType} sync job immediately...`);
    const startTime = Date.now();
    
    try {
      switch (jobType) {
        case 'metrics':
          await this.dataSyncService.syncMetrics();
          break;
        case 'events':
          await this.dataSyncService.syncRecentEvents(24);
          break;
        case 'campaigns':
          await this.dataSyncService.syncCampaigns();
          break;
        case 'flows':
          await this.dataSyncService.syncFlows();
          break;
        case 'profiles':
          await this.dataSyncService.syncProfiles();
          break;
      }
      
      const duration = Date.now() - startTime;
      logger.info(`${jobType} sync completed in ${duration}ms`);
    } catch (error) {
      logger.error(`${jobType} sync failed:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
export const syncScheduler = new SyncScheduler();

export default syncScheduler;
