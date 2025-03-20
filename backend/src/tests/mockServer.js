import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Load mock data
const mockDataPath = path.join(__dirname, '../../../app/public/mock-data.js');
const mockDataModule = await import(`file://${mockDataPath}`);
const mockData = mockDataModule.default;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Overview endpoint
app.get('/api/overview', (req, res) => {
  res.json(mockData.overview);
});

// Campaigns endpoint
app.get('/api/campaigns', (req, res) => {
  res.json(mockData.campaigns);
});

// Flows endpoint
app.get('/api/flows', (req, res) => {
  res.json(mockData.flows);
});

// Forms endpoint
app.get('/api/forms', (req, res) => {
  res.json(mockData.forms);
});

// Segments endpoint
app.get('/api/segments', (req, res) => {
  res.json(mockData.segments);
});

// Charts endpoints
app.get('/api/charts/:type', (req, res) => {
  const { type } = req.params;
  const data = mockData[`charts/${type}`];
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ message: 'Chart data not found' });
  }
});

// Handle preflight requests
app.options('*', cors());

app.listen(port, () => {
  console.log(`Mock API server running on port ${port}`);
  console.log(`Test the server with: curl http://localhost:${port}/api/health`);
  console.log(`To test with the frontend: NEXT_PUBLIC_API_URL=http://localhost:${port}/api npm run dev`);
});
