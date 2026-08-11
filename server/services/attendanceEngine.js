import crypto from 'crypto';
import db from '../db/database.js';
import { addAuditEntry, addSecurityEvent } from '../middleware/auth.js';

/**
 * Generate a dynamic token for active attendance session (Rotates every 15 seconds)
 */
export const generateDynamicQRToken = (sessionId) => {
  const timeStep = Math.floor(Date.now() / 15000); // 15s window
  const secret = process.env.DYNAMIC_QR_SECRET || 'SECURE_DYN_QR_2026';
  return crypto.createHash('sha256').update(`${sessionId}|${timeStep}|${secret}`).digest('hex').substring(0, 16);
};

/**
 * Validate dynamic QR token against current or previous 15s window
 */
export const validateDynamicQRToken = (sessionId, token) => {
  const currentStep = Math.floor(Date.now() / 15000);
  const prevStep = currentStep - 1;
  const secret = process.env.DYNAMIC_QR_SECRET || 'SECURE_DYN_QR_2026';

  const validToken1 = crypto.createHash('sha256').update(`${sessionId}|${currentStep}|${secret}`).digest('hex').substring(0, 16);
  const validToken2 = crypto.createHash('sha256').update(`${sessionId}|${prevStep}|${secret}`).digest('hex').substring(0, 16);

  return token === validToken1 || token === validToken2;
};

/**
 * Create a new Attendance Session
 */
export const createAttendanceSession = (lecturer, { subjectId, section, durationMinutes = 60, verificationPolicy = 'PASSKEY_OR_OTP' }) => {
  const subject = db.prepare('SELECT s.*, c.department_id FROM subjects s JOIN courses c ON s.course_id = c.id WHERE s.id = ?').get(subjectId);
  if (!subject) {
    throw new Error('Invalid subject specified.');
  }

  const sessionId = 'SESS-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  const initialToken = generateDynamicQRToken(sessionId);

  const stmt = db.prepare(`
    INSERT INTO attendance_sessions (id, subject_id, lecturer_id, department_id, section, start_time, end_time, status, dynamic_token, verification_policy)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `);

  stmt.run(sessionId, subjectId, lecturer.id, subject.department_id, section, startTime.toISOString(), endTime.toISOString(), initialToken, verificationPolicy);

  addAuditEntry({
    actorId: lecturer.id,
    actorRole: lecturer.role,
    action: 'ATTENDANCE_SESSION_CREATED',
    targetResource: sessionId,
    details: `Session created for ${subject.name} (${section}), Duration: ${durationMinutes} mins`
  });

  return {
    sessionId,
    subjectName: subject.name,
    section,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    status: 'ACTIVE',
    dynamicToken: initialToken
  };
};

/**
 * Get Active Attendance Sessions
 */
export const getActiveSessions = () => {
  // Auto-expire sessions past end_time
  db.prepare("UPDATE attendance_sessions SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND datetime('now') > datetime(end_time)").run();

  return db.prepare(`
    SELECT s.*, subj.name as subject_name, subj.code as subject_code, u.name as lecturer_name, d.name as department_name,
    (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id) as present_count
    FROM attendance_sessions s
    JOIN subjects subj ON s.subject_id = subj.id
    JOIN users u ON s.lecturer_id = u.id
    JOIN departments d ON s.department_id = d.id
    WHERE s.status IN ('ACTIVE', 'VERIFYING')
    ORDER BY s.start_time DESC
  `).all();
};

/**
 * Record Attendance (Server Verification Authority)
 */
export const recordAttendanceTransaction = ({ student, sessionId, verificationMethod, qrToken = null, req = null }) => {
  // 1. Fetch Session
  const session = db.prepare('SELECT * FROM attendance_sessions WHERE id = ?').get(sessionId);
  if (!session) {
    throw new Error('Attendance session not found.');
  }

  // 2. Check Session Status & Expiration
  if (session.status !== 'ACTIVE' && session.status !== 'VERIFYING') {
    throw new Error(`Attendance session is ${session.status.toLowerCase()}. Submissions are no longer accepted.`);
  }

  if (new Date() > new Date(session.end_time)) {
    db.prepare("UPDATE attendance_sessions SET status = 'EXPIRED' WHERE id = ?").run(sessionId);
    throw new Error('Attendance session has expired.');
  }

  // 3. Verify Student Section / Department Eligibility
  if (student.section !== session.section && student.role !== 'SUPER_ADMIN') {
    addSecurityEvent({
      userId: student.id,
      eventType: 'UNAUTHORIZED_SESSION_ACCESS',
      severity: 'MEDIUM',
      details: `Student (${student.name}, section ${student.section}) attempted to submit attendance for section ${session.section}`,
      req
    });
    throw new Error(`You are registered in section ${student.section}. This session is designated for section ${session.section}.`);
  }

  // 4. Validate Dynamic QR Token if method is DYNAMIC_QR
  if (verificationMethod === 'DYNAMIC_QR') {
    if (!qrToken || !validateDynamicQRToken(sessionId, qrToken)) {
      addSecurityEvent({
        userId: student.id,
        eventType: 'EXPIRED_OR_REPLAYED_QR_TOKEN',
        severity: 'HIGH',
        details: `Dynamic QR token validation failed for student ${student.name}. Potential screenshot reuse.`,
        req
      });
      throw new Error('Dynamic QR token expired or invalid. Screenshots cannot be reused.');
    }
  }

  // 5. Database Transaction to prevent race conditions and duplicate entries
  const recordId = 'ATT-REC-' + crypto.randomBytes(6).toString('hex').toUpperCase();

  const insertStmt = db.prepare(`
    INSERT INTO attendance_records (id, session_id, student_id, status, verification_method, confidence_score, timestamp, ip_address)
    VALUES (?, ?, ?, 'PRESENT', ?, 99, datetime('now'), ?)
  `);

  try {
    insertStmt.run(recordId, sessionId, student.id, verificationMethod, req?.ip || '127.0.0.1');
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return {
        success: false,
        isDuplicate: true,
        message: 'Attendance already recorded for this session.'
      };
    }
    throw err;
  }

  addAuditEntry({
    actorId: student.id,
    actorRole: student.role,
    action: 'ATTENDANCE_RECORDED',
    targetResource: recordId,
    details: `Attendance marked PRESENT via ${verificationMethod} for session ${sessionId}`,
    req
  });

  return {
    success: true,
    recordId,
    status: 'PRESENT',
    studentName: student.name,
    collegeId: student.college_id,
    timestamp: new Date().toISOString(),
    verificationMethod,
    message: 'Attendance recorded and verified by server.'
  };
};
