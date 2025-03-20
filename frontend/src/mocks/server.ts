import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * This configures a request mocking server with the given request handlers
 * for Node.js environments (used in server-side rendering with Next.js)
 * 
 * Note: Before using this, you need to install MSW:
 * npm install --save-dev msw
 */
export const server = setupServer(...handlers);

/**
 * Initialize MSW in Node.js environment
 */
export function initMswServer() {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    console.log('🔶 Mock Service Worker enabled in Node.js');
    
    // Start the server
    server.listen({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    });
    
    // Clean up after tests
    process.once('SIGINT', () => server.close());
    process.once('SIGTERM', () => server.close());
  }
}
