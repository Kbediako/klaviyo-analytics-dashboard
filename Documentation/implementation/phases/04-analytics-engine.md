# Phase 4: Analytics Engine Development (Weeks 7-8)

## Overview

This phase focuses on implementing the analytics engine that provides statistical analysis, forecasting, and data processing capabilities for the dashboard.

## Timeline

- Week 7: Basic Time-Series Analysis and Forecasting
- Week 8: Advanced Analytics and API Integration

## Implementation Details

### 4.1 Implement Basic Time-Series Analysis (Week 7)

```typescript
// backend/src/analytics/timeSeriesAnalyzer.ts
import { db } from '../database';

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

export interface TimeSeriesResult {
  trend: TimeSeriesPoint[];
  seasonal: TimeSeriesPoint[];
  residual: TimeSeriesPoint[];
  original: TimeSeriesPoint[];
}

export class TimeSeriesAnalyzer {
  async getTimeSeries(
    metricId: string, 
    startDate: Date, 
    endDate: Date, 
    interval: string = '1 day'
  ): Promise<TimeSeriesPoint[]> {
    const result = await db.query(
      `SELECT 
        time_bucket($1, timestamp) AS bucket,
        SUM(value) AS value
      FROM klaviyo_events
      WHERE metric_id = $2 AND timestamp BETWEEN $3 AND $4
      GROUP BY bucket
      ORDER BY bucket ASC`,
      [interval, metricId, startDate, endDate]
    );
    
    return result.rows.map(row => ({
      timestamp: row.bucket,
      value: parseFloat(row.value)
    }));
  }
  
  // Simple moving average to extract trend
  async extractTrend(
    timeSeries: TimeSeriesPoint[], 
    windowSize: number = 7
  ): Promise<TimeSeriesPoint[]> {
    if (timeSeries.length < windowSize) {
      return timeSeries;
    }
    
    const trend: TimeSeriesPoint[] = [];
    
    for (let i = 0; i < timeSeries.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - Math.floor(windowSize / 2)); 
           j <= Math.min(timeSeries.length - 1, i + Math.floor(windowSize / 2)); 
           j++) {
        sum += timeSeries[j].value;
        count++;
      }
      
      trend.push({
        timestamp: timeSeries[i].timestamp,
        value: sum / count
      });
    }
    
    return trend;
  }
  
  // Decompose time series into trend, seasonal, and residual components
  async decompose(
    metricId: string, 
    startDate: Date, 
    endDate: Date,
    interval: string = '1 day',
    windowSize: number = 7
  ): Promise<TimeSeriesResult> {
    const original = await this.getTimeSeries(metricId, startDate, endDate, interval);
    const trend = await this.extractTrend(original, windowSize);
    
    // Calculate residual (original - trend)
    const residual = original.map((point, i) => ({
      timestamp: point.timestamp,
      value: point.value - trend[i].value
    }));
    
    // For simplicity, we're not calculating true seasonal components here
    const seasonal = residual.map(point => ({
      timestamp: point.timestamp,
      value: 0
    }));
    
    return {
      trend,
      seasonal,
      residual,
      original
    };
  }
}
```

### 4.2 Build Forecasting Models (Week 7-8)

```typescript
// backend/src/analytics/forecastService.ts
import { TimeSeriesAnalyzer, TimeSeriesPoint } from './timeSeriesAnalyzer';

export interface ForecastResult {
  forecast: TimeSeriesPoint[];
  confidence: {
    upper: TimeSeriesPoint[];
    lower: TimeSeriesPoint[];
  };
  accuracy: number;
}

export class ForecastService {
  private timeSeriesAnalyzer: TimeSeriesAnalyzer;
  
  constructor() {
    this.timeSeriesAnalyzer = new TimeSeriesAnalyzer();
  }
  
  // Simple last-value forecast (baseline)
  async naiveForecast(
    metricId: string,
    startDate: Date,
    endDate: Date,
    forecastHorizon: number
  ): Promise<ForecastResult> {
    const historical = await this.timeSeriesAnalyzer.getTimeSeries(
      metricId, startDate, endDate, '1 day'
    );
    
    if (historical.length === 0) {
      throw new Error('Not enough data for forecasting');
    }
    
    const lastDate = historical[historical.length - 1].timestamp;
    const lastValue = historical[historical.length - 1].value;
    
    // Calculate standard deviation for confidence intervals
    const values = historical.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length
    );
    
    // Generate forecast points
    const forecast: TimeSeriesPoint[] = [];
    const upper: TimeSeriesPoint[] = [];
    const lower: TimeSeriesPoint[] = [];
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      forecast.push({
        timestamp: forecastDate,
        value: lastValue
      });
      
      upper.push({
        timestamp: forecastDate,
        value: lastValue + 1.96 * stdDev
      });
      
      lower.push({
        timestamp: forecastDate,
        value: Math.max(0, lastValue - 1.96 * stdDev)
      });
    }
    
    return {
      forecast,
      confidence: {
        upper,
        lower
      },
      accuracy: 0.5 // Placeholder
    };
  }
}
```

### 4.3 Create Analytics API Endpoints (Week 8)

```typescript
// backend/src/controllers/analyticsController.ts
import { Request, Response } from 'express';
import { TimeSeriesAnalyzer } from '../analytics/timeSeriesAnalyzer';
import { ForecastService } from '../analytics/forecastService';
import { parseDateRange } from '../utils/dateUtils';

export class AnalyticsController {
  private timeSeriesAnalyzer: TimeSeriesAnalyzer;
  private forecastService: ForecastService;
  
  constructor() {
    this.timeSeriesAnalyzer = new TimeSeriesAnalyzer();
    this.forecastService = new ForecastService();
  }
  
  async getTimeSeries(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRange = parseDateRange(req.query.dateRange as string);
      const interval = req.query.interval as string || '1 day';
      
      const timeSeries = await this.timeSeriesAnalyzer.getTimeSeries(
        metricId, dateRange.start, dateRange.end, interval
      );
      
      res.json(timeSeries);
    } catch (error) {
      console.error('Error fetching time series:', error);
      res.status(500).json({ error: 'Failed to fetch time series data' });
    }
  }
  
  async getTimeSeriesDecomposition(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRange = parseDateRange(req.query.dateRange as string);
      const interval = req.query.interval as string || '1 day';
      const windowSize = parseInt(req.query.windowSize as string || '7', 10);
      
      const decomposition = await this.timeSeriesAnalyzer.decompose(
        metricId, dateRange.start, dateRange.end, interval, windowSize
      );
      
      res.json(decomposition);
    } catch (error) {
      console.error('Error decomposing time series:', error);
      res.status(500).json({ error: 'Failed to decompose time series data' });
    }
  }
  
  async getForecast(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRange = parseDateRange(req.query.dateRange as string);
      const forecastHorizon = parseInt(req.query.horizon as string || '30', 10);
      
      const forecast = await this.forecastService.naiveForecast(
        metricId, dateRange.start, dateRange.end, forecastHorizon
      );
      
      res.json(forecast);
    } catch (error) {
      console.error('Error generating forecast:', error);
      res.status(500).json({ error: 'Failed to generate forecast' });
    }
  }
}
```

### 4.4 Create API Routes for Analytics (Week 8)

```typescript
// backend/src/routes/analyticsRoutes.ts
import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';

const router = express.Router();
const analytics = new AnalyticsController();

// Time series data
router.get('/timeseries/:metricId', analytics.getTimeSeries.bind(analytics));

// Time series decomposition
router.get('/decomposition/:metricId', analytics.getTimeSeriesDecomposition.bind(analytics));

// Forecasting
router.get('/forecast/:metricId', analytics.getForecast.bind(analytics));

export default router;
```

## Testing

### Unit Tests for Analytics Engine

```typescript
// backend/src/analytics/__tests__/timeSeriesAnalyzer.test.ts
import { TimeSeriesAnalyzer, TimeSeriesPoint } from '../timeSeriesAnalyzer';
import { db } from '../../database';

jest.mock('../../database');

describe('TimeSeriesAnalyzer', () => {
  let analyzer: TimeSeriesAnalyzer;
  
  beforeEach(() => {
    analyzer = new TimeSeriesAnalyzer();
  });
  
  it('should extract trend correctly', async () => {
    const timeSeries: TimeSeriesPoint[] = [
      { timestamp: new Date('2025-01-01'), value: 10 },
      { timestamp: new Date('2025-01-02'), value: 12 },
      { timestamp: new Date('2025-01-03'), value: 15 },
      { timestamp: new Date('2025-01-04'), value: 11 },
      { timestamp: new Date('2025-01-05'), value: 13 }
    ];
    
    const trend = await analyzer.extractTrend(timeSeries, 3);
    
    expect(trend).toHaveLength(5);
    expect(trend[2].value).toBeCloseTo(12.67, 2); // Middle point
  });
  
  it('should handle empty time series', async () => {
    const timeSeries: TimeSeriesPoint[] = [];
    const trend = await analyzer.extractTrend(timeSeries);
    expect(trend).toHaveLength(0);
  });
});
```

## Success Criteria

- [ ] Time series analysis functions implemented and tested
- [ ] Forecasting models producing accurate predictions
- [ ] API endpoints for analytics features working correctly
- [ ] Performance requirements met (sub-second response for most queries)
- [ ] All unit tests passing
- [ ] Integration tests passing

## Next Steps

After completing this phase:
1. Review analytics performance and accuracy
2. Fine-tune forecasting models based on real data
3. Begin frontend integration in Phase 5
4. Document analytics capabilities and usage
