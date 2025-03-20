import { setupWorker, type SetupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * This configures a Service Worker with the given request handlers for browser environments
 */
export const worker: SetupWorker = setupWorker(...handlers);

/**
 * Initialize MSW in the browser
 * 
 * Note: Before using this, you need to install MSW:
 * npm install --save-dev msw
 */
export function initMswBrowser() {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    console.log('🔶 Mock Service Worker enabled in browser');
    worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    }).catch(error => {
      console.error('MSW worker start failed:', error);
    });
  }
}
