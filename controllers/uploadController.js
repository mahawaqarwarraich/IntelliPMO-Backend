/**
 * POST /api/upload (protected).
 * Uses Multer to save the incoming file to uploads/, then returns filePath, fileName, fileType.
 */
export function handleUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const PORT = process.env.PORT || 5000;
    const filePath = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({
      filePath,
      fileName: req.file.originalname || req.file.filename,
      fileType: req.file.mimetype || '',
    });
  } catch (err) {
    console.error('handleUpload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed.' });
  }
}
