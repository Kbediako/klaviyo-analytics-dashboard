/**
 * Environment variable validator
 * 
 * This utility validates that all required environment variables are set
 * and have valid values.
 */

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'KLAVIYO_API_KEY',
  'PORT',
];

/**
 * Optional environment variables with default values
 */
const OPTIONAL_ENV_VARS: Record<string, string> = {
  'NODE_ENV': 'development',
  'PORT': '3001',
};

/**
 * Validate environment variables
 * 
 * @returns Object with validation result
 */
export function validateEnv(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required environment variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }
  
  // Set default values for optional environment variables
  for (const [envVar, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[envVar]) {
      process.env[envVar] = defaultValue;
    }
  }
  
  // Validate Klaviyo API key format (if present)
  if (process.env.KLAVIYO_API_KEY && !isValidApiKey(process.env.KLAVIYO_API_KEY)) {
    errors.push('Invalid KLAVIYO_API_KEY format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate API key format
 * 
 * @param apiKey API key to validate
 * @returns Whether the API key is valid
 */
function isValidApiKey(apiKey: string): boolean {
  // Klaviyo API keys are typically alphanumeric strings
  // This is a simple validation, adjust as needed
  return /^[a-zA-Z0-9_-]+$/.test(apiKey);
}

/**
 * Initialize environment variables
 * 
 * @returns Whether initialization was successful
 */
export function initEnv(): boolean {
  const { isValid, errors } = validateEnv();
  
  if (!isValid) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    return false;
  }
  
  return true;
}
