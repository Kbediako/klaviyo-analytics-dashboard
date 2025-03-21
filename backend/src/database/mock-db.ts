import { QueryResult } from 'pg';
import { logger } from '../utils/logger';

/**
 * Mock Database class that simulates a database connection
 * but doesn't actually connect to a database.
 * This is used when the DISABLE_DB environment variable is set to true.
 */
class MockDatabase {
  private static instance: MockDatabase;
  
  private constructor() {
    logger.info('Using mock database (database connections disabled)');
  }
  
  /**
   * Get the singleton instance of the MockDatabase
   */
  public static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
    }
    return MockDatabase.instance;
  }
  
  /**
   * Mock query method that returns an empty result
   */
  public async query(
    text: string, 
    params?: any[],
    options?: { 
      retries?: number,
      timeout?: number 
    }
  ): Promise<QueryResult> {
    logger.debug('Mock query executed', { 
      text: text.substring(0, 100),
      params: params ? JSON.stringify(params).substring(0, 100) : undefined
    });
    
    // Return a mock QueryResult
    return {
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: []
    };
  }
  
  /**
   * Mock withClient method that executes the callback with a mock client
   */
  public async withClient<T>(callback: (client: any) => Promise<T>): Promise<T> {
    // Create a mock client with a query method
    const mockClient = {
      query: async () => ({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      }),
      release: () => {}
    };
    
    try {
      return await callback(mockClient);
    } catch (error) {
      logger.error('Error in mock client operation', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Mock transaction method that executes the callback with a mock client
   */
  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    return this.withClient(callback);
  }
  
  /**
   * Mock getPoolMetrics method that returns empty metrics
   */
  public getPoolMetrics(): any {
    return {
      total: 0,
      idle: 0,
      active: 0,
      waitingClients: 0,
      maxConnections: 0,
      usage: 0,
      lastChecked: new Date()
    };
  }
  
  /**
   * Mock healthCheck method that always returns true
   */
  public async healthCheck(): Promise<boolean> {
    return true;
  }
  
  /**
   * Mock close method that does nothing
   */
  public async close(): Promise<void> {
    logger.info('Mock database connection closed');
  }
}

// Export a singleton instance if DB is disabled
const DISABLE_DB = process.env.DISABLE_DB === 'true';

export const db = DISABLE_DB 
  ? MockDatabase.getInstance() 
  : require('./index').db;
