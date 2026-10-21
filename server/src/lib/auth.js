import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

const SESSION_COOKIE_NAME = 'sha_session';
const SESSION_DURATION_DAYS = 14;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function createSession(userId, req) {
  const sessionToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
      ipAddress,
      userAgent
    }
  });

  return { session, sessionToken, expiresAt };
}

export async function invalidateSession(sessionToken) {
  if (!sessionToken) return;
  try {
    await prisma.session.delete({
      where: { sessionToken }
    });
  } catch (err) {
    // Session may already be removed
  }
}

export async function getSessionUser(sessionToken) {
  if (!sessionToken) return null;
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        include: {
          profile: true
        }
      }
    }
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export function setSessionCookie(res, token, expiresAt) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: expiresAt,
    path: '/'
  });
}

export function clearSessionCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
}

export { SESSION_COOKIE_NAME };
