/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

// PII Sanitization Helper
export function maskPhone(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.trim();
  if (cleaned.length < 7) return '***';
  // Keep first 5-6 characters (country code + area) and last 4
  const start = cleaned.slice(0, Math.min(6, cleaned.length - 4));
  const end = cleaned.slice(-4);
  return `${start} *** ${end}`;
}

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

// Deep sanitize object to prevent PII or secret leakage in logs
export function sanitizeLogData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogData);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('password') || keyLower.includes('secret') || keyLower.includes('token') || keyLower.includes('key')) {
      sanitized[key] = '[REDACTED_SECRET]';
    } else if (keyLower.includes('phone') && typeof val === 'string') {
      sanitized[key] = maskPhone(val);
    } else if (keyLower.includes('email') && typeof val === 'string') {
      sanitized[key] = maskEmail(val);
    } else if (typeof val === 'object') {
      sanitized[key] = sanitizeLogData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  correlationId?: string;
  event: string;
  meta?: Record<string, any>;
}

class Logger {
  private formatLog(level: LogLevel, event: string, meta?: Record<string, any>, correlationId?: string): string {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      correlationId: correlationId || (meta?.correlationId as string) || undefined,
      event,
      meta: meta ? sanitizeLogData(meta) : undefined
    };
    return JSON.stringify(log);
  }

  info(event: string, meta?: Record<string, any>, correlationId?: string) {
    console.log(this.formatLog('INFO', event, meta, correlationId));
  }

  warn(event: string, meta?: Record<string, any>, correlationId?: string) {
    console.warn(this.formatLog('WARN', event, meta, correlationId));
  }

  error(event: string, meta?: Record<string, any>, correlationId?: string) {
    console.error(this.formatLog('ERROR', event, meta, correlationId));
  }

  audit(event: string, meta?: Record<string, any>, correlationId?: string) {
    console.log(this.formatLog('AUDIT', event, meta, correlationId));
  }
}

export const logger = new Logger();
