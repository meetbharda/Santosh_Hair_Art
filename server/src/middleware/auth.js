import { getSessionUser, SESSION_COOKIE_NAME } from '../lib/auth.js';

export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (!token) {
      req.user = null;
      return next();
    }

    const user = await getSessionUser(token);
    req.user = user;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.'
      });
    }

    const user = await getSessionUser(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Session has expired or is invalid. Please log in again.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Authentication check failed.'
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrative privileges required.'
    });
  }
  next();
}
