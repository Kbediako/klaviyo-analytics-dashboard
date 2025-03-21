/**
 * Lighthouse CI Configuration
 * 
 * This file configures Lighthouse CI for performance testing in the GitHub Actions workflow.
 * It sets performance budgets, thresholds, and other configuration options.
 */

module.exports = {
  ci: {
    collect: {
      // Number of runs to collect metrics
      numberOfRuns: 3,
      
      // Use desktop configuration
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: ['uses-http2'],
      },
      
      // Start server before collecting metrics
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'ready on',
      url: ['http://localhost:3000/'],
    },
    
    upload: {
      // Upload results to temporary storage
      target: 'temporary-public-storage',
    },
    
    assert: {
      // Performance score thresholds
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        
        // Specific metric thresholds
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Ensure important resources are loaded
        'resource-summary:document:size': ['warn', { maxNumericValue: 50000 }],
        'resource-summary:font:count': ['warn', { maxNumericValue: 5 }],
        'resource-summary:third-party:count': ['warn', { maxNumericValue: 10 }],
      },
    },
  },
};
