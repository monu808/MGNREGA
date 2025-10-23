import express from 'express';
import DistrictController from '../controllers/districtController.js';

const router = express.Router();

router.get('/', DistrictController.getAllDistricts);
router.get('/search', DistrictController.searchDistricts);
router.get('/nearby', DistrictController.getNearbyDistricts);
router.get('/state/:stateId', DistrictController.getDistrictsByState);
router.get('/:id', DistrictController.getDistrictById);

export default router;
