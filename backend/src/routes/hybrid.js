import express from 'express';
import {
  getStates,
  getDistrictsByState,
  getDistrictPerformance,
  getDistrictPerformanceHistory,
} from '../controllers/hybridApiController.js';

const router = express.Router();

// Get all states (cached)
router.get('/states', getStates);

// Get districts by state (cached)
router.get('/districts/:stateName', getDistrictsByState);

// Get district performance history (must come before :districtName)
router.get('/performance/:districtName/history', getDistrictPerformanceHistory);

// Get latest performance for a district
router.get('/performance/:districtName', getDistrictPerformance);

export default router;
