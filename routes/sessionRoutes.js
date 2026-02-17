import { Router } from 'express';
import { getSessions, getActiveSession } from '../controllers/sessionController.js';

const router = Router();

router.get('/', getSessions);
router.get('/active', getActiveSession);

export default router;
