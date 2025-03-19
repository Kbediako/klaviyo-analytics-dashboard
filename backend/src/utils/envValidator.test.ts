import { validateEnv } from './envValidator';

describe('Environment Validator', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };
  
  // Reset environment variables after each test
  afterEach(() => {
    process.env = { ...originalEnv };
  });
  
  it('should validate required environment variables', () => {
    // Set required environment variables
    process.env.KLAVIYO_API_KEY = 'test-api-key';
    process.env.PORT = '3001';
    
    const result = validateEnv();
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should return errors for missing required environment variables', () => {
    // Clear required environment variables
    delete process.env.KLAVIYO_API_KEY;
    delete process.env.PORT;
    
    const result = validateEnv();
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing required environment variable: KLAVIYO_API_KEY');
    expect(result.errors).toContain('Missing required environment variable: PORT');
  });
  
  it('should set default values for optional environment variables', () => {
    // Clear optional environment variables
    delete process.env.NODE_ENV;
    
    // Set required environment variables
    process.env.KLAVIYO_API_KEY = 'test-api-key';
    process.env.PORT = '3001';
    
    validateEnv();
    
    expect(process.env.NODE_ENV).toBe('development');
  });
  
  it('should validate API key format', () => {
    // Set invalid API key
    process.env.KLAVIYO_API_KEY = 'invalid@api#key';
    process.env.PORT = '3001';
    
    const result = validateEnv();
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid KLAVIYO_API_KEY format');
  });
  
  it('should accept valid API key format', () => {
    // Set valid API key
    process.env.KLAVIYO_API_KEY = 'valid-api-key-123';
    process.env.PORT = '3001';
    
    const result = validateEnv();
    
    expect(result.isValid).toBe(true);
  });
});
