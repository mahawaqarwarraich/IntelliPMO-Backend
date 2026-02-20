import express from 'express';
import { registerSupervisor, loginSupervisor, getAllSupervisors, deleteSupervisor } from '../controllers/supervisorController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerSupervisor);
router.post('/login', loginSupervisor);

router.get('/', authMiddleware, getAllSupervisors);
router.delete('/:id', authMiddleware, deleteSupervisor);

export default router;
