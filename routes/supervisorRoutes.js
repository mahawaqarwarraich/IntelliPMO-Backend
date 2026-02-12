import express from 'express';
import { registerSupervisor, loginSupervisor } from '../controllers/supervisorController.js';

const router = express.Router();

router.post('/register', registerSupervisor);
router.post('/login', loginSupervisor);

export default router;
