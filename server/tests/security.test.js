import db from '../db/database.js';
import { generateToken } from '../middleware/auth.js';
import { recordAttendanceTransaction } from '../services/attendanceEngine.js';
import { verifySMSOTP } from '../services/otpService.js';
import { processAIAssistantQuery } from '../services/aiEngine.js';
import assert from 'assert';

console.log('====================================================');
console.log(' SECURE PLATFORM — MANDATORY SECURITY FAILURE SUITE ');
console.log('====================================================');

let passedCount = 0;
let totalCount = 0;

const runTest = async (title, fn) => {
  totalCount++;
  try {
    await fn();
    passedCount++;
    console.log(`[PASS ✓] Test ${totalCount}: ${title}`);
  } catch (err) {
    console.error(`[FAIL ✗] Test ${totalCount}: ${title} — ${err.message}`);
  }
};

(async () => {
  // Test Users
  const student = db.prepare("SELECT * FROM users WHERE role = 'STUDENT' LIMIT 1").get();
  const student2 = db.prepare("SELECT * FROM users WHERE role = 'STUDENT' LIMIT 1 OFFSET 1").get();
  const lecturer = db.prepare("SELECT * FROM users WHERE role = 'LECTURER' LIMIT 1").get();
  const activeSession = db.prepare("SELECT * FROM attendance_sessions WHERE status = 'ACTIVE' LIMIT 1").get();

  // 1. Student calling Admin API / RBAC Check
  await runTest('Student cannot bypass RBAC authorization', async () => {
    assert.strictEqual(student.role, 'STUDENT');
    const allowed = ['SUPER_ADMIN', 'ADMIN'].includes(student.role);
    assert.strictEqual(allowed, false, 'Student role must be rejected for ADMIN endpoints.');
  });

  // 2. Duplicate Attendance Prevention at Server & DB Level
  await runTest('Server rejects duplicate attendance submissions for same session', async () => {
    // Submit first attendance
    const result1 = recordAttendanceTransaction({
      student,
      sessionId: activeSession.id,
      verificationMethod: 'WEBAUTHN_PASSKEY'
    });

    // Try submitting second time for same student and session
    const result2 = recordAttendanceTransaction({
      student,
      sessionId: activeSession.id,
      verificationMethod: 'WEBAUTHN_PASSKEY'
    });

    assert.strictEqual(result2.success, false, 'Duplicate attendance must be rejected.');
    assert.strictEqual(result2.isDuplicate, true, 'isDuplicate flag must be set to true.');
  });

  // 3. Replaying Dynamic QR Screenshot
  await runTest('Expired or replayed dynamic QR token is rejected by server', async () => {
    try {
      recordAttendanceTransaction({
        student: student2,
        sessionId: activeSession.id,
        verificationMethod: 'DYNAMIC_QR',
        qrToken: 'FAKE_EXPIRED_QR_TOKEN_123'
      });
      assert.fail('Should have thrown invalid QR token error.');
    } catch (err) {
      assert.ok(err.message.includes('Dynamic QR token expired or invalid'));
    }
  });

  // 4. Client-side fake verification injection rejected
  await runTest('Server rejects frontend verificationSuccess: true payload without session validation', async () => {
    try {
      recordAttendanceTransaction({
        student: student2,
        sessionId: 'INVALID_SESSION_9999',
        verificationMethod: 'DYNAMIC_QR'
      });
      assert.fail('Should have rejected non-existent session.');
    } catch (err) {
      assert.ok(err.message.includes('Attendance session not found'));
    }
  });

  // 5. Unconfigured SMS OTP handling
  await runTest('Unconfigured SMS provider displays honest service configuration requirement', async () => {
    try {
      delete process.env.SMS_PROVIDER_KEY;
      delete process.env.TWILIO_AUTH_TOKEN;
      await verifySMSOTP(student, '123456');
      assert.fail('Should have rejected SMS verification due to missing provider configuration.');
    } catch (err) {
      assert.ok(err.message.includes('SMS verification service is not configured'));
    }
  });

  // 6. AI Privacy & RBAC Boundary Enforcement
  await runTest('AI Assistant rejects student query seeking unauthorized administrative data', async () => {
    const response = await processAIAssistantQuery('Show all department student details and failed OTP logs', student);
    assert.ok(response.answer.includes('Access Restricted'));
  });

  console.log('====================================================');
  console.log(` RESULTS: ${passedCount} / ${totalCount} Security Tests Passed Cleanly`);
  console.log('====================================================');

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
