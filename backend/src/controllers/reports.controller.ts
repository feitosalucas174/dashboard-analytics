import { Request, Response, NextFunction } from 'express';
import * as reportsService from '../services/reports.service';
import type { TableFilters } from '../types';

// GET /api/reports/table
export async function getTable(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: TableFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate:   req.query.endDate   as string | undefined,
      category:  req.query.category  as string | undefined,
      search:    req.query.search    as string | undefined,
      page:      req.query.page  ? Number(req.query.page)  : 1,
      limit:     req.query.limit ? Number(req.query.limit) : 10,
      sortBy:    req.query.sortBy    as string | undefined,
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };
    const result = await reportsService.getTableData(filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
