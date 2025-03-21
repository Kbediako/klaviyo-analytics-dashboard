/**
 * Environment Configuration
 * 
 * This module manages environment-specific settings and provides
 * validation and access to configuration values.
 */

// Define the environment types
type Environment = 'development' | 'staging' | 'production' | 'test';

// Define the configuration schema
interface EnvironmentConfig {
  apiUrl: string;
  apiVersion: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  redisUrl: string;
  klaviyoApiKey: string;
  jwtSecret: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableCaching: boolean;
  cacheMaxAge: number; // in seconds
  rateLimit: {
    windowMs: number; // in milliseconds
    maxRequests: number;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

// Default configuration values
const defaultConfig: EnvironmentConfig = {
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  apiVersion: process.env.API_VERSION || '2023-10-15',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '5432', 10),
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'postgres',
  dbName: process.env.DB_NAME || 'klaviyo_analytics',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  klaviyoApiKey: process.env.KLAVIYO_API_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-do-not-use-in-production',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
  enableCaching: process.env.ENABLE_CACHING === 'true',
  cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE || '300', 10),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
};

// Environment-specific configurations
const environmentConfigs: Record<Environment, Partial<EnvironmentConfig>> = {
  development: {
    logLevel: 'debug',
    enableCaching: false,
    cacheMaxAge: 60,
    rateLimit: {
      windowMs: 60000,
      maxRequests: 1000, // Higher for development
    },
  },
  
  test: {
    dbName: 'klaviyo_test',
    logLevel: 'error',
    enableCaching: false,
    rateLimit: {
      windowMs: 60000,
      maxRequests: 1000,
    },
  },
  
  staging: {
    logLevel: 'info',
    enableCaching: true,
    cacheMaxAge: 300, // 5 minutes
    rateLimit: {
      windowMs: 60000,
      maxRequests: 200,
    },
    cors: {
      origin: ['https://staging.example.com', 'https://analytics.staging.example.com'],
      credentials: true,
    },
  },
  
  production: {
    logLevel: 'warn',
    enableCaching: true,
    cacheMaxAge: 600, // 10 minutes
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100,
    },
    cors: {
      origin: ['https://example.com', 'https://analytics.example.com'],
      credentials: true,
    },
  },
};

// Get the current environment
const getEnvironment = (): Environment => {
  const env = (process.env.NODE_ENV || 'development').toLowerCase() as Environment;
  return ['development', 'test', 'staging', 'production'].includes(env) 
    ? env as Environment 
    : 'development';
};

// Merge default config with environment-specific config
const getCurrentConfig = (): EnvironmentConfig => {
  const environment = getEnvironment();
  return {
    ...defaultConfig,
    ...environmentConfigs[environment],
  };
};

// Validate that required environment variables are set
const validateConfig = (config: EnvironmentConfig): string[] => {
  const errors: string[] = [];
  
  // List of required variables in production
  if (getEnvironment() === 'production') {
    if (!process.env.DB_PASSWORD || config.dbPassword === defaultConfig.dbPassword) {
      errors.push('DB_PASSWORD must be set in production');
    }
    
    if (!process.env.KLAVIYO_API_KEY) {
      errors.push('KLAVIYO_API_KEY must be set in production');
    }
    
    if (!process.env.JWT_SECRET || config.jwtSecret === defaultConfig.jwtSecret) {
      errors.push('JWT_SECRET must be set in production');
    }
  }
  
  return errors;
};

// Get the config and validate it
const config = getCurrentConfig();
const validationErrors = validateConfig(config);

// Log validation errors
if (validationErrors.length > 0) {
  console.error('Environment configuration errors:');
  validationErrors.forEach(error => console.error(`- ${error}`));
  
  if (getEnvironment() === 'production') {
    throw new Error('Invalid production configuration. See errors above.');
  }
}

export default config;
export { getEnvironment, validateConfig };