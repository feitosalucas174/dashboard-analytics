import { Request, Response, NextFunction } from 'express';
import * as metricsService from '../services/metrics.service';
import type { MetricFilters } from '../types';

// GET /api/metrics/kpis
export async function getKPIs(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: MetricFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate:   req.query.endDate   as string | undefined,
      category:  req.query.category  as string | undefined,
    };
    const data = await metricsService.getKPIs(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/metrics/timeline
export async function getTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: MetricFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate:   req.query.endDate   as string | undefined,
      category:  req.query.category  as string | undefined,
    };
    const data = await metricsService.getTimeline(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/metrics/distribution
export async function getDistribution(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: MetricFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate:   req.query.endDate   as string | undefined,
    };
    const data = await metricsService.getCategoryDistribution(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/metrics/comparison
export async function getComparison(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: MetricFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate:   req.query.endDate   as string | undefined,
    };
    const data = await metricsService.getComparison(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/metrics/realtime
export async function getRealtime(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await metricsService.getRealtimeData();
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}
