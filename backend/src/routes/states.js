import express from 'express';
import StateController from '../controllers/stateController.js';

const router = express.Router();

router.get('/', StateController.getAllStates);
router.get('/:id', StateController.getStateById);

export default router;
