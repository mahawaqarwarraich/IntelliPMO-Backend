import express from 'express';
import { registerStudent, loginStudent, getMe, getStudentsList, getAllStudents, deleteStudent } from '../controllers/studentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);

router.get('/me', authMiddleware, getMe);
router.get('/list', authMiddleware, getStudentsList);
router.get('/', authMiddleware, getAllStudents);
router.delete('/:id', authMiddleware, deleteStudent);

export default router;
