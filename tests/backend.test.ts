/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { db, SlotConflictError } from '../src/db/database.ts';
import { verifyStripeWebhookSignature, activeSessions } from '../src/middleware/security.ts';
import { maskPhone, maskEmail } from '../src/lib/logger.ts';
import { SUPPORTED_TIMEZONES } from '../src/data/businessData.ts';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, category: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      name,
      category,
      passed: true,
      message: 'PASSED',
      durationMs: Date.now() - start
    });
    console.log(`✓ [PASS] [${category}] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      name,
      category,
      passed: false,
      message: err.message || String(err),
      durationMs: Date.now() - start
    });
    console.error(`✗ [FAIL] [${category}] ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('===============================================================');
  console.log('SIHub Business Assistant – Production Readiness Backend Tests');
  console.log('===============================================================\n');

  // Test 1: Concurrency Test (10 simultaneous booking requests for the same slot)
  await runTest(
    '10 Parallel Asynchronous Bookings for Identical Slot (Concurrency Lock)',
    'Database & Concurrency',
    async () => {
      const testDate = '2026-11-20';
      const testTime = '09:30';
      const testTimezone = 'Africa/Mogadishu';

      // Launch 10 parallel booking attempts simultaneously
      const attempts = Array.from({ length: 10 }, (_, i) => ({
        serviceId: 'sih-ai-strategy',
        customerName: `Concurrent Client ${i + 1}`,
        customerEmail: `client${i + 1}@parallel-test.io`,
        customerPhone: `+252 61 000 ${1000 + i}`,
        date: testDate,
        time: testTime,
        timezone: testTimezone
      }));

      const settled = await Promise.allSettled(
        attempts.map(input => db.createBookingWithTransaction(input))
      );

      const successful = settled.filter(s => s.status === 'fulfilled');
      const rejected = settled.filter(s => s.status === 'rejected');

      if (successful.length !== 1) {
        throw new Error(`Expected exactly 1 booking to succeed, but ${successful.length} succeeded! Concurrency breach.`);
      }

      if (rejected.length !== 9) {
        throw new Error(`Expected 9 bookings to be rejected with conflict, but ${rejected.length} were rejected.`);
      }

      // Verify rejection reason is SlotConflictError
      for (const rej of rejected) {
        if (rej.status === 'rejected') {
          const err = rej.reason;
          if (!err || (!err.message.includes('already') && err.code !== 'SLOT_ALREADY_BOOKED')) {
            throw new Error(`Unexpected error type on rejection: ${err?.message}`);
          }
        }
      }
    }
  );

  // Test 2: Double-Booking Prevention across non-concurrent sequential attempts
  await runTest(
    'Sequential Attempt for Same Slot Rejection',
    'Database & Concurrency',
    async () => {
      try {
        await db.createBookingWithTransaction({
          serviceId: 'sih-ai-strategy',
          customerName: 'Second Wave Client',
          customerEmail: 'wave2@test.io',
          customerPhone: '+252 61 999 1111',
          date: '2026-11-20',
          time: '09:30',
          timezone: 'Africa/Mogadishu'
        });
        throw new Error('Expected slot to be blocked by previous test, but insert succeeded!');
      } catch (err: any) {
        if (!(err instanceof SlotConflictError) && !err.message.includes('already')) {
          throw err;
        }
      }
    }
  );

  // Test 3: Releasing Slot Upon Cancellation
  await runTest(
    'Cancellation Releases Slot For New Booking',
    'Database & Concurrency',
    async () => {
      // Find the booking created in Test 1
      const bookings = await db.getBookings({ date: '2026-11-20' });
      const target = bookings.find(b => b.time === '09:30' && b.status !== 'cancelled');
      if (!target) throw new Error('Target booking for cancellation test not found.');

      // Cancel it
      const { booking, policyMessage } = await db.cancelBooking(target.id);
      if (booking.status !== 'cancelled') throw new Error('Booking status was not updated to cancelled.');

      // Verify slot is now open and can be re-booked
      const isAvailable = await db.checkSlotAvailability('2026-11-20', '09:30', 'Africa/Mogadishu');
      if (!isAvailable) throw new Error('Slot should be available after cancellation, but reported occupied.');

      // Re-book slot
      const rebooked = await db.createBookingWithTransaction({
        serviceId: 'sih-ai-strategy',
        customerName: 'Slot Replacement Client',
        customerEmail: 'replacement@test.io',
        customerPhone: '+252 61 444 3322',
        date: '2026-11-20',
        time: '09:30',
        timezone: 'Africa/Mogadishu'
      });

      if (!rebooked.id) throw new Error('Failed to rebook slot after cancellation.');
    }
  );

  // Test 4: Stripe Webhook Cryptographic HMAC Signature Verification (Task 4)
  await runTest(
    'Stripe Webhook Signature Verification with Valid HMAC-SHA256',
    'Payment & Webhook Security',
    async () => {
      const secret = 'whsec_test_secret_key_123';
      const payload = JSON.stringify({ id: 'evt_test_success', type: 'payment_intent.succeeded' });
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`, 'utf8')
        .digest('hex');

      const sigHeader = `t=${timestamp},v1=${signature}`;
      const result = verifyStripeWebhookSignature(payload, sigHeader, secret);

      if (!result.valid) {
        throw new Error(`Expected valid signature, got invalid: ${result.reason}`);
      }
    }
  );

  // Test 5: Stripe Webhook Tampered Payload Rejection
  await runTest(
    'Stripe Webhook Rejects Tampered Payload or Forged Signature',
    'Payment & Webhook Security',
    async () => {
      const secret = 'whsec_test_secret_key_123';
      const originalPayload = JSON.stringify({ id: 'evt_test', amount: 350 });
      const tamperedPayload = JSON.stringify({ id: 'evt_test', amount: 10 }); // Hacked amount
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${originalPayload}`, 'utf8')
        .digest('hex');

      const sigHeader = `t=${timestamp},v1=${signature}`;
      const result = verifyStripeWebhookSignature(tamperedPayload, sigHeader, secret);

      if (result.valid) {
        throw new Error('Security flaw: Tampered payload accepted by signature verifier!');
      }
    }
  );

  // Test 6: Stripe Webhook Replay Attack Defense (Timestamp > 300s)
  await runTest(
    'Stripe Webhook Rejects Expired Timestamp (Replay Attack Defense)',
    'Payment & Webhook Security',
    async () => {
      const secret = 'whsec_test_secret_key_123';
      const payload = JSON.stringify({ id: 'evt_replay' });
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 350; // 350s old (> 300s tolerance)

      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${expiredTimestamp}.${payload}`, 'utf8')
        .digest('hex');

      const sigHeader = `t=${expiredTimestamp},v1=${signature}`;
      const result = verifyStripeWebhookSignature(payload, sigHeader, secret);

      if (result.valid) {
        throw new Error('Security flaw: Replay attack accepted (> 300s old timestamp)!');
      }
    }
  );

  // Test 7: PII Masking Utilities (Task 6)
  await runTest(
    'Customer Phone & Email PII Masking',
    'PII & Data Privacy',
    async () => {
      const maskedUS = maskPhone('+1 (415) 555-0192');
      const maskedSomalia = maskPhone('+252 61 890 4231');
      const maskedEmail = maskEmail('sarah.jenkins@novapay.io');

      if (!maskedUS.includes('***')) throw new Error('Phone not properly masked.');
      if (!maskedSomalia.includes('***')) throw new Error('Somalia phone not properly masked.');
      if (!maskedEmail.includes('***') || maskedEmail.includes('jenkins')) {
        throw new Error('Email not properly masked.');
      }
    }
  );

  // Test 8: Timezone Schedule Verification (Africa/Mogadishu EAT)
  await runTest(
    'Africa/Mogadishu (EAT, UTC+3) Business Schedule Rules',
    'Timezone & Localization',
    async () => {
      const mogadishuConfig = SUPPORTED_TIMEZONES.find(t => t.id === 'Africa/Mogadishu');
      if (!mogadishuConfig) throw new Error('Africa/Mogadishu timezone not found in supported config.');

      // In Mogadishu, Friday is closed (Jumu'ah)
      if (mogadishuConfig.operatingHours.friday.isOpen) {
        throw new Error('Mogadishu schedule should have Friday set to isOpen: false.');
      }

      // Saturday to Thursday are open
      if (!mogadishuConfig.operatingHours.saturday.isOpen || !mogadishuConfig.operatingHours.thursday.isOpen) {
        throw new Error('Mogadishu schedule should have Saturday and Thursday set to isOpen: true.');
      }
    }
  );

  // Test 9: RBAC Token Session Validation (Task 5)
  await runTest(
    'RBAC Session Token Validation',
    'Authentication & RBAC',
    async () => {
      const demoToken = 'sihub_admin_sec_2026_demo';
      const session = activeSessions.get(demoToken);
      if (!session || session.role !== 'admin') {
        throw new Error('Admin demo session token not registered or missing admin role.');
      }

      const invalidToken = activeSessions.get('fake_unauthorized_token');
      if (invalidToken) {
        throw new Error('Non-existent token returned active session.');
      }
    }
  );

  console.log('\n===============================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
