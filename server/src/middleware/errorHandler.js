import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to standard express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const issues = err.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: issues
    });
  }

  // Handle slot conflict or business logic error
  if (err.code === 'SLOT_CONFLICT') {
    return res.status(409).json({
      success: false,
      error: err.message,
      code: 'SLOT_CONFLICT'
    });
  }

  if (err.code === 'SLOT_BLOCKED') {
    return res.status(409).json({
      success: false,
      error: err.message,
      code: 'SLOT_BLOCKED'
    });
  }

  console.error('Unhandled server error:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(err.status || 500).json({
    success: false,
    error: isProduction ? 'An unexpected server error occurred.' : (err.message || 'Internal server error')
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}
