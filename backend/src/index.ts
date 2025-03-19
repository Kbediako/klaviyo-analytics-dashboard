import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import overviewRoutes from './routes/overview';
// import campaignsRoutes from './routes/campaigns';
// import flowsRoutes from './routes/flows';
// import formsRoutes from './routes/forms';
// import segmentsRoutes from './routes/segments';

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

// Register routes
app.use('/api/overview', overviewRoutes);
// app.use('/api/campaigns', campaignsRoutes);
// app.use('/api/flows', flowsRoutes);
// app.use('/api/forms', formsRoutes);
// app.use('/api/segments', segmentsRoutes);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
