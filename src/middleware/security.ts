/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../lib/logger.ts';

export type UserRole = 'admin' | 'manager' | 'customer_guest';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface SecurityRequest extends Request {
  user?: AuthenticatedUser;
  correlationId?: string;
  rawBody?: Buffer | string;
}

// In-memory active sessions store
export const activeSessions = new Map<string, AuthenticatedUser>();

// Pre-seeded demo admin session for evaluation
const DEMO_ADMIN_TOKEN = 'sihub_admin_sec_2026_demo';
activeSessions.set(DEMO_ADMIN_TOKEN, {
  id: 'usr_admin_01',
  email: 'admin@sihub.com',
  name: 'SIHub Executive Admin',
  role: 'admin'
});

// Pre-seeded manager session
const DEMO_MANAGER_TOKEN = 'sihub_manager_sec_2026_demo';
activeSessions.set(DEMO_MANAGER_TOKEN, {
  id: 'usr_manager_01',
  email: 'operations@sihub.com',
  name: 'Operations Manager',
  role: 'manager'
});

// ----------------------------------------------------------------------
// 1. Correlation ID Middleware
// ----------------------------------------------------------------------
export function correlationMiddleware(req: SecurityRequest, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}

// ----------------------------------------------------------------------
// 2. Authentication & RBAC Middleware
// ----------------------------------------------------------------------
export function requireRole(allowedRoles: UserRole[]) {
  return (req: SecurityRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('AUTH_FAILED_MISSING_TOKEN', { path: req.path, method: req.method }, req.correlationId);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Missing Bearer token in Authorization header.',
          correlationId: req.correlationId
        }
      });
    }

    const token = authHeader.split('Bearer ')[1].trim();
    const session = activeSessions.get(token);

    if (!session) {
      logger.warn('AUTH_FAILED_INVALID_TOKEN', { path: req.path }, req.correlationId);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired session token. Please re-authenticate.',
          correlationId: req.correlationId
        }
      });
    }

    if (!allowedRoles.includes(session.role)) {
      logger.warn('RBAC_FORBIDDEN', { user: session.email, role: session.role, required: allowedRoles }, req.correlationId);
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: User role '${session.role}' lacks permission for this administrative endpoint. Required: [${allowedRoles.join(', ')}]`,
          correlationId: req.correlationId
        }
      });
    }

    req.user = session;
    next();
  };
}

// ----------------------------------------------------------------------
// 3. Rate Limiter (Sliding Window in Memory)
// ----------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitEntry>();

export function rateLimiter(limit: number = 60, windowMs: number = 60000) {
  return (req: SecurityRequest, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${ip}_${req.baseUrl || req.path}`;
    const now = Date.now();

    let entry = rateLimits.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      rateLimits.set(key, entry);
    } else {
      entry.count += 1;
    }

    if (entry.count > limit) {
      logger.warn('RATE_LIMIT_EXCEEDED', { ip, path: req.path, count: entry.count, limit }, req.correlationId);
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please slow down. Rate limit of ${limit} req/min exceeded.`,
          correlationId: req.correlationId
        }
      });
    }

    next();
  };
}

// ----------------------------------------------------------------------
// 4. Input Validation Middleware for Bookings
// ----------------------------------------------------------------------
export function validateBookingInput(req: SecurityRequest, res: Response, next: NextFunction) {
  const { customerName, customerPhone, customerEmail, date, time } = req.body;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_NAME', message: 'Customer name is required and must be at least 2 characters.', correlationId: req.correlationId }
    });
  }

  // International phone number check (supports Somalia +252, US +1, UK +44, etc.)
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  if (!customerPhone || !phoneRegex.test(customerPhone.trim())) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PHONE', message: 'Valid phone number with country code is required (e.g. +252 61 555 4231 or +1 415 555 0192).', correlationId: req.correlationId }
    });
  }

  // Date format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date || !dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_DATE', message: 'Booking date must be in YYYY-MM-DD format.', correlationId: req.correlationId }
    });
  }

  // Reject past dates (allow today and future)
  const todayStr = new Date().toISOString().split('T')[0];
  if (date < todayStr) {
    return res.status(400).json({
      success: false,
      error: { code: 'PAST_DATE_NOT_ALLOWED', message: 'Cannot book appointments for past dates.', correlationId: req.correlationId }
    });
  }

  // Time format HH:MM
  const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!time || !timeRegex.test(time)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TIME', message: 'Booking time must be in 24-hour HH:MM format (e.g. 09:00 or 14:30).', correlationId: req.correlationId }
    });
  }

  next();
}

// ----------------------------------------------------------------------
// 5. Cryptographic Stripe Webhook Signature Verifier
// ----------------------------------------------------------------------
export function verifyStripeWebhookSignature(
  rawPayload: string,
  sigHeader: string | undefined,
  secret: string
): { valid: boolean; reason?: string } {
  if (!sigHeader) {
    return { valid: false, reason: 'Missing stripe-signature header' };
  }

  // Parse header: t=1794169529,v1=abc123...
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts['t'];
  const signature = parts['v1'];

  if (!timestamp || !signature) {
    return { valid: false, reason: 'Malformed stripe-signature header format (requires t and v1)' };
  }

  // Reject replay attacks older than 300 seconds (5 minutes)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTimestamp - parseInt(timestamp, 10));
  if (isNaN(timeDiff) || timeDiff > 300) {
    return { valid: false, reason: `Timestamp out of tolerance (${timeDiff}s > 300s). Replay attack rejected.` };
  }

  // Compute expected HMAC-SHA256 signature
  const signedPayload = `${timestamp}.${rawPayload}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: 'Signature length mismatch' };
  }

  const matches = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  if (!matches) {
    return { valid: false, reason: 'Cryptographic HMAC signature does not match secret' };
  }

  return { valid: true };
}
