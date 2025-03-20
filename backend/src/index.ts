import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { cacheMiddleware } from './middleware/cacheMiddleware';
import { defaultRateLimiter, strictRateLimiter } from './middleware/rateLimitMiddleware';
import { initEnv } from './utils/envValidator';

// Load environment variables
dotenv.config();

// Validate environment variables
if (!initEnv()) {
  console.error('Failed to initialize environment variables. Exiting...');
  process.exit(1);
}

// Import routes
import overviewRoutes from './routes/overview';
import campaignsRoutes from './routes/campaigns';
import flowsRoutes from './routes/flows';
import formsRoutes from './routes/forms';
import segmentsRoutes from './routes/segments';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Error handling middleware
interface ErrorWithStatus extends Error {
  status?: number;
}

app.use((err: ErrorWithStatus, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: {
      message: err.message,
      status: statusCode
    }
  });
});

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Define cache TTLs (in seconds) for different endpoints
const CACHE_TTLS = {
  overview: 600,    // 10 minutes (increased from 5 minutes)
  campaigns: 1200,  // 20 minutes (increased from 10 minutes)
  flows: 1200,      // 20 minutes (increased from 10 minutes)
  forms: 1200,      // 20 minutes (increased from 10 minutes)
  segments: 1200,   // 20 minutes (increased from 10 minutes)
};

// Apply default rate limiter to all API routes
app.use('/api', defaultRateLimiter);

// Register routes with caching
app.use('/api/overview', cacheMiddleware(CACHE_TTLS.overview), overviewRoutes);
app.use('/api/campaigns', cacheMiddleware(CACHE_TTLS.campaigns), campaignsRoutes);
app.use('/api/flows', cacheMiddleware(CACHE_TTLS.flows), flowsRoutes);
app.use('/api/forms', cacheMiddleware(CACHE_TTLS.forms), formsRoutes);
app.use('/api/segments', cacheMiddleware(CACHE_TTLS.segments), segmentsRoutes);

// Apply stricter rate limits to the health endpoint
app.use('/api/health', strictRateLimiter);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
