import { Pool, PoolClient } from 'pg';

/**
 * Database connection manager using the Singleton pattern
 * Provides connection pooling and query execution
 */
class Database {
  private static instance: Database;
  private pool: Pool;
  
  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'klaviyo',
      password: process.env.DB_PASSWORD || 'klaviyo_pass',
      database: process.env.DB_NAME || 'klaviyo_analytics',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection not established
    });
    
    // Log any pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  /**
   * Get the singleton instance of the Database
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  /**
   * Execute a query with optional parameters
   * @param text SQL query text
   * @param params Query parameters
   * @returns Query result
   */
  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Query error', { text, params, error });
      throw error;
    }
  }
  
  /**
   * Get a client from the pool and execute a callback with it
   * Automatically releases the client back to the pool
   * @param callback Function to execute with the client
   * @returns Result of the callback
   */
  public async withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }
  
  /**
   * Execute a transaction with the provided callback
   * Automatically handles commit/rollback
   * @param callback Function to execute within the transaction
   * @returns Result of the callback
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return this.withClient(async (client) => {
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  }
  
  /**
   * Close the pool and all connections
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export a singleton instance
export const db = Database.getInstance();
