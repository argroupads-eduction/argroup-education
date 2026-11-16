import { Router } from 'express';
import {
  handleNeetPredict,
  handleNeetValidate,
  neetPredictValidators,
} from '../handlers/neetPredict';

const router = Router();

/** POST /api/neet/predict — marks → AIR (NTA multi-year engine) */
router.post('/predict', neetPredictValidators, handleNeetPredict);

/** GET /api/neet/validate — accuracy matrix vs NTA 2025 anchors */
router.get('/validate', handleNeetValidate);

export default router;
