import express from 'express';
import {
  getStates,
  getDistrictsByState,
  getDistrictPerformance,
  getDistrictPerformanceHistory,
} from '../controllers/directApiController.js';

const router = express.Router();

/**
 * Direct API Routes - Real-time data from data.gov.in
 */

// Get all states
router.get('/states', getStates);

// Get districts by state
router.get('/districts/:stateName', getDistrictsByState);

// Get district performance history (must be before /:districtName to avoid route conflict)
router.get('/performance/:districtName/history', getDistrictPerformanceHistory);

// Get district performance (latest)
router.get('/performance/:districtName', getDistrictPerformance);

export default router;
