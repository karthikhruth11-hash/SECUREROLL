import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import userRoutes from './routes/userRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allowed for development and WebAuthn credentials
}));

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);

// Health check endpoint
app.use('/api', auditRoutes);

// Serve static dist folder in production if available
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('{*path}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('SECURE Server Running. Please run "npm run build" to serve the frontend bundle.');
    }
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.code || 'SERVER_ERROR',
    message: err.message || 'An internal server security error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` SECURE — AI Enterprise College Platform Server Running `);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

export default app;
