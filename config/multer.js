import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  // ignore if already exists
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const name = (file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${name}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export { upload };
