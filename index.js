import 'dotenv/config';
import fs from 'fs';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supervisorRoutes from './routes/supervisorRoutes.js';
import domainRoutes from './routes/domainRoutes.js';
import evaluatorRoutes from './routes/evaluatorRoutes.js';
import sessionPolicyRoutes from './routes/sessionPolicyRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import domainsSupervisorsRoutes from './routes/domainsSupervisorsRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import adminGroupRoutes from './routes/adminGroupRoutes.js';
import supervisorGroupRoutes from './routes/supervisorGroupRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import deadlineRoutes from './routes/deadlineRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

try {
  fs.mkdirSync('uploads', { recursive: true });
} catch (_) {}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/students', studentRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/evaluators', evaluatorRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/session-policy', sessionPolicyRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/domains-supervisors', domainsSupervisorsRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin/groups', adminGroupRoutes);
app.use('/api/supervisor/groups', supervisorGroupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/deadlines', deadlineRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FYP Management System API' });
});

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/IntelliPMO')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
