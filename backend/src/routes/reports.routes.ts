import { Router } from 'express';
import * as ctrl from '../controllers/reports.controller';

const router = Router();

router.get('/table', ctrl.getTable);

export default router;
