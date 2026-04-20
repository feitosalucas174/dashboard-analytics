import { Router } from 'express';
import * as ctrl from '../controllers/export.controller';

const router = Router();

router.get('/pdf',   ctrl.exportPDF);
router.get('/excel', ctrl.exportExcel);

export default router;
