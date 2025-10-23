import express from 'express';
import PerformanceController from '../controllers/performanceController.js';

const router = express.Router();

// Order matters! More specific routes first
router.get('/compare', PerformanceController.compareDistricts);
router.get('/:districtId/history', PerformanceController.getPerformanceHistory);
router.get('/:districtId', PerformanceController.getLatestPerformance);

export default router;
