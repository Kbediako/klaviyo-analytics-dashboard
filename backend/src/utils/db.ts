/**
 * Re-export the database module from ../database/mock-db.ts
 * This file exists to maintain compatibility with imports that expect db to be in utils/
 * 
 * The mock-db.ts file will check the DISABLE_DB environment variable and
 * either use a mock database or the real database from ../database/index.ts
 */
export { db } from '../database/mock-db';
