import express from 'express';
import { loginUnified } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUnified);

export default router;
