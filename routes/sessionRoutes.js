import { Router } from 'express';
import { getSessions } from '../controllers/sessionController.js';

const router = Router();

router.get('/', getSessions);

export default router;
