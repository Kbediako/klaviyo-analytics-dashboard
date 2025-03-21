/**
 * API client compatibility layer
 * 
 * This file maintains backward compatibility with existing code while
 * delegating to the new modular implementation.
 */

// Re-export everything from the new modular API client
export * from './api';

// Note: This file exists for backward compatibility.
// New code should import directly from 'lib/api' instead.
