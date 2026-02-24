import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getGroupsByAdmin, updateGroupByAdmin } from '../controllers/groupController.js';

const router = express.Router();


router.get('/', authMiddleware, getGroupsByAdmin);
router.patch('/:id', authMiddleware, updateGroupByAdmin);


export default router;
