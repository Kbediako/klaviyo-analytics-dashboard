import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';

/**
 * Retry configuration for database queries
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
  retryableErrors: string[];
}

/**
 * Pool metrics for monitoring connection pool health
 */
interface PoolMetrics {
  total: number;
  idle: number;
  active: number;
  waitingClients: number;
  maxConnections: number;
  usage: number; // Percentage of connections in use
  lastChecked: Date;
}

/**
 * Database connection manager using the Singleton pattern
 * Provides connection pooling and query execution with retry logic,
 * connection pooling optimization, and monitoring.
 */
class Database {
  private static instance: Database;
  private pool: Pool;
  private metrics: PoolMetrics;
  private readonly retryConfig: RetryConfig;
  private metricsInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Get configuration from environment with reasonable defaults
    const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '50', 10);
    const minConnections = parseInt(process.env.DB_MIN_CONNECTIONS || '5', 10);
    const idleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10);
    const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10);
    const statementTimeout = parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10);
    
    // Initialize connection pool with optimized settings
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'klaviyo',
      password: process.env.DB_PASSWORD || 'klaviyo_pass',
      database: process.env.DB_NAME || 'klaviyo_analytics',
      max: maxConnections,                 // Maximum number of clients in the pool
      min: minConnections,                 // Minimum number of idle clients maintained in the pool
      idleTimeoutMillis: idleTimeout,      // Close idle clients after 30 seconds by default
      connectionTimeoutMillis: connectionTimeout, // Return an error after 5 seconds if connection not established
      allowExitOnIdle: false,              // Don't exit when all clients are idle
      statement_timeout: statementTimeout, // Terminate queries that run too long
      application_name: 'klaviyo-analytics-dashboard', // Helps with monitoring in PostgreSQL
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
    });
    
    // Configure retry settings
    this.retryConfig = {
      maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3', 10),
      initialDelay: parseInt(process.env.DB_INITIAL_RETRY_DELAY || '100', 10),
      maxDelay: parseInt(process.env.DB_MAX_RETRY_DELAY || '3000', 10),
      factor: parseFloat(process.env.DB_RETRY_FACTOR || '2'),
      retryableErrors: [
        'connection timeout',
        'idle client timeout',
        'Connection terminated',
        'server closed the connection unexpectedly',
        'connection reset by peer',
        'too many clients already',
      ],
    };
    
    // Initialize metrics
    this.metrics = {
      total: 0,
      idle: 0,
      active: 0,
      waitingClients: 0,
      maxConnections,
      usage: 0,
      lastChecked: new Date(),
    };
    
    // Setup event handlers
    this.setupEventHandlers();
    
    // Start metrics collection
    this.startMetricsCollection();
    
    logger.info('Database connection pool initialized', {
      maxConnections,
      minConnections,
      retrySettings: this.retryConfig,
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
   * Execute a query with optional parameters and retry logic
   * @param text SQL query text
   * @param params Query parameters
   * @param options Optional settings for this query
   * @returns Query result
   */
  public async query(
    text: string, 
    params?: any[],
    options?: { 
      retries?: number,
      timeout?: number 
    }
  ): Promise<QueryResult> {
    const maxRetries = options?.retries ?? this.retryConfig.maxRetries;
    const timeout = options?.timeout;
    
    // Track performance
    const start = Date.now();
    let attempt = 0;
    let lastError;
    
    // Implement exponential backoff retry
    while (attempt <= maxRetries) {
      try {
        // Add statement timeout if specified
        const queryConfig = timeout 
          ? { text: `SET statement_timeout TO ${timeout}; ${text}`, values: params }
          : { text, values: params };
        
        // Execute the query
        const res = await this.pool.query(queryConfig);
        const duration = Date.now() - start;
        
        // Log success
        if (attempt > 0) {
          logger.info(`Query succeeded after ${attempt} retries`, { 
            text: text.substring(0, 100), 
            duration,
            params: params ? JSON.stringify(params).substring(0, 100) : undefined,
            rows: res.rowCount 
          });
        } else if (duration > 1000) {
          // Log slow queries
          logger.warn(`Slow query execution (${duration}ms)`, { 
            text: text.substring(0, 100),
            rows: res.rowCount 
          });
        } else {
          logger.debug('Query executed', { 
            text: text.substring(0, 100),
            duration, 
            rows: res.rowCount 
          });
        }
        
        return res;
      } catch (error: any) {
        lastError = error;
        
        // Determine if the error is retryable
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || attempt >= maxRetries) {
          // Log failure and rethrow the error
          logger.error(`Query failed ${attempt > 0 ? `after ${attempt} retries` : ''}`, { 
            text: text.substring(0, 100),
            params: params ? JSON.stringify(params).substring(0, 100) : undefined,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          this.retryConfig.maxDelay,
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.factor, attempt)
        );
        const jitter = delay * 0.2 * Math.random();
        const retryDelay = Math.round(delay + jitter);
        
        logger.warn(`Retrying query in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`, {
          error: error instanceof Error ? error.message : String(error),
          text: text.substring(0, 100),
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempt++;
      }
    }
    
    // This should not be reached due to throw in catch block,
    // but TypeScript requires a return statement
    throw lastError;
  }
  
  /**
   * Get a client from the pool and execute a callback with it
   * Automatically releases the client back to the pool
   * @param callback Function to execute with the client
   * @returns Result of the callback
   */
  public async withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    let client: PoolClient | null = null;
    let attempt = 0;
    
    while (attempt <= this.retryConfig.maxRetries) {
      try {
        // Get a client from the pool
        client = await this.pool.connect();
        
        // Execute the callback
        return await callback(client);
      } catch (error: any) {
        // Release the client if we got one
        if (client) {
          client.release(error instanceof Error && this.isConnectionError(error));
          client = null;
        }
        
        // Determine if we should retry
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || attempt >= this.retryConfig.maxRetries) {
          logger.error(`Error executing client operation after ${attempt} attempts`, {
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          this.retryConfig.maxDelay,
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.factor, attempt)
        );
        const jitter = delay * 0.2 * Math.random();
        const retryDelay = Math.round(delay + jitter);
        
        logger.warn(`Retrying client operation in ${retryDelay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`, {
          error: error instanceof Error ? error.message : String(error),
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempt++;
      } finally {
        if (client) {
          client.release();
        }
      }
    }
    
    // This should not be reached
    throw new Error('Failed to execute client operation after multiple retries');
  }
  
  /**
   * Execute a transaction with the provided callback
   * Automatically handles commit/rollback with retry support
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
        try {
          // Attempt to roll back the transaction
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          // Log the rollback error but throw the original error
          logger.error('Failed to rollback transaction', {
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
            originalError: error instanceof Error ? error.message : String(error),
          });
        }
        throw error;
      }
    });
  }
  
  /**
   * Get current pool metrics
   * @returns Pool metrics snapshot
   */
  public getPoolMetrics(): PoolMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Check the database connection by executing a simple query
   * @returns True if the database is reachable, false otherwise
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1 AS health_check');
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
  
  /**
   * Close the pool and all connections
   */
  public async close(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    logger.info('Closing database connection pool');
    await this.pool.end();
  }
  
  /**
   * Setup event handlers for pool events
   * @private
   */
  private setupEventHandlers(): void {
    // Handle errors on idle clients
    this.pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle client', {
        error: err.message,
        stack: err.stack,
      });
    });
    
    // Optional event handlers if pool implementation supports them
    if (typeof this.pool.on === 'function') {
      // If you're using a version of node-postgres that supports these events
      // @ts-ignore - These events might not be in the type definitions
      this.pool.on('connect', (client) => {
        logger.debug('New client connected to the pool');
      });
      
      // @ts-ignore - These events might not be in the type definitions
      this.pool.on('remove', (client) => {
        logger.debug('Client removed from the pool');
      });
    }
  }
  
  /**
   * Start collecting metrics about the pool
   * @private
   */
  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    const interval = parseInt(process.env.DB_METRICS_INTERVAL || '30000', 10);
    
    this.metricsInterval = setInterval(() => {
      this.updatePoolMetrics();
    }, interval);
    
    // Initial metrics update
    this.updatePoolMetrics();
  }
  
  /**
   * Update pool metrics by querying pool state
   * @private
   */
  private updatePoolMetrics(): void {
    try {
      // Get current pool stats
      // For pg-pool, we need to access private properties
      // This is implementation-specific and may break with pg-pool updates
      const poolStats = (this.pool as any).totalCount
        ? {
            totalCount: (this.pool as any).totalCount,
            idleCount: (this.pool as any).idleCount,
            waitingCount: (this.pool as any).waitingCount,
          }
        : {
            totalCount: 0,
            idleCount: 0,
            waitingCount: 0,
          };
      
      this.metrics = {
        total: poolStats.totalCount || 0,
        idle: poolStats.idleCount || 0,
        active: (poolStats.totalCount || 0) - (poolStats.idleCount || 0),
        waitingClients: poolStats.waitingCount || 0,
        maxConnections: this.pool.options.max || 0,
        usage: this.pool.options.max 
          ? ((poolStats.totalCount || 0) - (poolStats.idleCount || 0)) / this.pool.options.max * 100 
          : 0,
        lastChecked: new Date(),
      };
      
      // Log high connection usage as warning
      if (this.metrics.usage > 80) {
        logger.warn('Database connection pool usage high', {
          usage: `${Math.round(this.metrics.usage)}%`,
          active: this.metrics.active,
          max: this.metrics.maxConnections,
          waitingClients: this.metrics.waitingClients,
        });
      } else {
        logger.debug('Database connection pool metrics', {
          usage: `${Math.round(this.metrics.usage)}%`,
          active: this.metrics.active,
          idle: this.metrics.idle,
          total: this.metrics.total,
          max: this.metrics.maxConnections,
          waitingClients: this.metrics.waitingClients,
        });
      }
    } catch (error) {
      logger.error('Error updating pool metrics', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  /**
   * Check if an error is retryable
   * @param error Error to check
   * @private
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || String(error);
    return this.retryConfig.retryableErrors.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  /**
   * Check if an error is a connection-level error
   * @param error Error to check
   * @private
   */
  private isConnectionError(error: any): boolean {
    if (!error) return false;
    
    const connectionErrors = [
      'connection terminated',
      'server closed the connection unexpectedly',
      'connection reset by peer',
    ];
    
    const errorMessage = error.message || String(error);
    return connectionErrors.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }
}

// Export a singleton instance
export const db = Database.getInstance();
