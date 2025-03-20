/**
 * MSW (Mock Service Worker) setup for the Klaviyo Analytics Dashboard
 * 
 * This file provides a way to initialize MSW for both browser and server environments.
 * 
 * To use MSW:
 * 1. Install MSW: npm install --save-dev msw
 * 2. Import and call initMsw() in your app entry point
 * 3. Set NEXT_PUBLIC_API_MOCKING=enabled in your environment
 * 
 * Example usage in Next.js app:
 * 
 * ```tsx
 * // app/layout.tsx or pages/_app.tsx
 * import { initMsw } from '@/mocks';
 * 
 * // Initialize MSW
 * if (process.env.NODE_ENV === 'development') {
 *   initMsw();
 * }
 * ```
 */

// Import browser and server initialization functions
import { initMswBrowser } from './browser';
import { initMswServer } from './server';

/**
 * Initialize MSW based on the current environment
 */
export async function initMsw() {
  // Only initialize if API mocking is enabled
  if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return;
  }

  // Check if we're in a browser or Node.js environment
  if (typeof window === 'undefined') {
    // We're in a Node.js environment (SSR)
    await import('./server').then(({ initMswServer }) => {
      initMswServer();
    });
  } else {
    // We're in a browser environment
    await import('./browser').then(({ initMswBrowser }) => {
      initMswBrowser();
    });
  }
}

// Re-export everything from handlers, browser, and server
export * from './handlers';
export * from './browser';
export * from './server';
export * from './mockData';
