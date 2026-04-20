import { Router } from 'express';
import * as ctrl from '../controllers/metrics.controller';

const router = Router();

router.get('/kpis',        ctrl.getKPIs);
router.get('/timeline',    ctrl.getTimeline);
router.get('/distribution',ctrl.getDistribution);
router.get('/comparison',  ctrl.getComparison);
router.get('/realtime',    ctrl.getRealtime);

export default router;
