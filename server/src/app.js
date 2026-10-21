import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import healthRoutes from './routes/health.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customer.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (defaultAllowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body and cookie parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'sha-secret-salt-default'));

// Rate limiting for auth routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again after 15 minutes.' }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Santosh Hair Art API',
    status: 'online',
    health: '/api/health'
  });
});

// Mount Routes
app.use('/api/health', healthRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
