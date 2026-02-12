import express from 'express';
import { getDomains } from '../controllers/domainController.js';

const router = express.Router();

router.get('/', getDomains);

export default router;
