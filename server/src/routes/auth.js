import express from 'express';
import crypto from 'node:crypto';
import prisma from '../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  invalidateSession,
  setSessionCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
  generateSecureToken
} from '../lib/auth.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/schemas.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
    }

    const passwordHash = await hashPassword(validated.password);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        role: 'CUSTOMER',
        profile: {
          create: {
            fullName: validated.fullName,
            phoneNumber: validated.phoneNumber
          }
        }
      },
      include: {
        profile: true
      }
    });

    const { sessionToken, expiresAt } = await createSession(user.id, req);
    setSessionCookie(res, sessionToken, expiresAt);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        token: sessionToken
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isValid = await verifyPassword(validated.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const { sessionToken, expiresAt } = await createSession(user.id, req);
    setSessionCookie(res, sessionToken, expiresAt);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        token: sessionToken
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (token) {
      await invalidateSession(token);
    }
    clearSessionCookie(res);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      profile: req.user.profile
    }
  });
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (!user) {
      // Return success even if not found to avoid user enumeration
      return res.json({
        success: true,
        message: 'If that email exists in our records, a password reset link has been generated.'
      });
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    // In local dev/demo environment without external SMTP configured,
    // return resetToken in payload so reset flow can be tested end-to-end
    const responsePayload = {
      success: true,
      message: 'Password reset token generated successfully.'
    };

    if (process.env.NODE_ENV !== 'production') {
      responsePayload.devResetToken = rawToken;
    }

    res.json(responsePayload);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(validated.token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Password reset token is invalid or has expired.' });
    }

    const newPasswordHash = await hashPassword(validated.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      }),
      // Invalidate existing sessions for security
      prisma.session.deleteMany({
        where: { userId: resetToken.userId }
      })
    ]);

    res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
});

export default router;
