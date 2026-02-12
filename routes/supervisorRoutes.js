import express from 'express';
import { registerSupervisor } from '../controllers/supervisorController.js';

const router = express.Router();

router.post('/register', registerSupervisor);

export default router;
