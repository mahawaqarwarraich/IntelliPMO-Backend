import { Router } from 'express';
import { getSessions, getActiveSession, getActiveSessionId } from '../controllers/sessionController.js';

const router = Router();

router.get('/', getSessions);
router.get('/active', getActiveSession);
router.get('/active-id', getActiveSessionId);

export default router;
