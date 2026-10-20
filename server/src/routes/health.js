import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Ping database
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      service: 'Santosh Hair Art API',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      service: 'Santosh Hair Art API',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message
    });
  }
});

export default router;
