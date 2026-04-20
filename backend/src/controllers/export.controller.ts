import { Request, Response, NextFunction } from 'express';
import * as metricsService from '../services/metrics.service';
import * as reportsService from '../services/reports.service';
import type { MetricFilters, ExportData } from '../types';

// Ambos os endpoints retornam JSON — o frontend gera o arquivo
async function buildExportPayload(filters: MetricFilters): Promise<ExportData> {
  const endDate   = filters.endDate   || new Date().toISOString().split('T')[0];
  const startDate = filters.startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const [kpis, byCategory, timeline, comparison, tableData] = await Promise.all([
    metricsService.getKPIs(filters),
    metricsService.getCategoryDistribution(filters),
    metricsService.getTimeline(filters),
    metricsService.getComparison(filters),
    reportsService.getAllDataForExport(filters),
  ]);

  return {
    period: { startDate, endDate },
    kpis,
    byCategory,
    timeline,
    comparison,
    tableData,
  };
}

// GET /api/export/pdf
export async function exportPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: MetricFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate:   req.query.endDate   as string | undefined,
      category:  req.query.category  as string | undefined,
    };
    const data = await buildExportPayload(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/export/excel
export async function exportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: MetricFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate:   req.query.endDate   as string | undefined,
      category:  req.query.category  as string | undefined,
    };
    const data = await buildExportPayload(filters);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
