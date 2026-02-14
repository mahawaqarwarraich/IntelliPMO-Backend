import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supervisorRoutes from './routes/supervisorRoutes.js';
import domainRoutes from './routes/domainRoutes.js';
import evaluatorRoutes from './routes/evaluatorRoutes.js';
import sessionPolicyRoutes from './routes/sessionPolicyRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/students', studentRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/evaluators', evaluatorRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/session-policy', sessionPolicyRoutes);

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
