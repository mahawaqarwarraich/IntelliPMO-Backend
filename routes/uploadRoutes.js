import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import { handleUpload } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', authMiddleware, upload.single('file'), handleUpload);

export default router;
