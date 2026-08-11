import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  createAttendanceSession,
  getActiveSessions,
  generateDynamicQRToken,
  recordAttendanceTransaction
} from '../services/attendanceEngine.js';

const router = express.Router();

/**
 * POST /api/attendance/session/create
 * Create a new dynamic attendance class session
 */
router.post('/session/create', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'HOD', 'LECTURER']), (req, res) => {
  try {
    const { subjectId, section, durationMinutes, verificationPolicy } = req.body;
    const session = createAttendanceSession(req.user, { subjectId, section, durationMinutes, verificationPolicy });
    res.json({ success: true, session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/attendance/sessions/active
 * Get list of currently active attendance sessions
 */
router.get('/sessions/active', authenticateToken, (req, res) => {
  try {
    const sessions = getActiveSessions();
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/attendance/session/:id/token
 * Get 15-second dynamic rotating QR token for active session (Lecturer view)
 */
router.get('/session/:id/token', authenticateToken, (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM attendance_sessions WHERE id = ?').get(req.params.id);
    if (!session || session.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Session is inactive or expired.' });
    }

    const token = generateDynamicQRToken(session.id);
    res.json({
      success: true,
      sessionId: session.id,
      token,
      expiresInSeconds: 15 - (Math.floor(Date.now() / 1000) % 15)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/attendance/mark
 * Perform attendance submission with server verification authority
 */
router.post('/mark', authenticateToken, (req, res) => {
  try {
    const { sessionId, verificationMethod, qrToken } = req.body;

    if (!sessionId || !verificationMethod) {
      return res.status(400).json({ success: false, message: 'Session ID and Verification Method are required.' });
    }

    const result = recordAttendanceTransaction({
      student: req.user,
      sessionId,
      verificationMethod,
      qrToken,
      req
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/attendance/session/:id/live
 * Live attendance monitor for active class session
 */
router.get('/session/:id/live', authenticateToken, (req, res) => {
  try {
    const session = db.prepare(`
      SELECT s.*, subj.name as subject_name, subj.code as subject_code
      FROM attendance_sessions s
      JOIN subjects subj ON s.subject_id = subj.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const records = db.prepare(`
      SELECT r.*, u.name as student_name, u.college_id, u.section
      FROM attendance_records r
      JOIN users u ON r.student_id = u.id
      WHERE r.session_id = ?
      ORDER BY r.timestamp DESC
    `).all(session.id);

    const sectionStudents = db.prepare("SELECT id, name, college_id FROM users WHERE role = 'STUDENT' AND section = ?").all(session.section);

    res.json({
      success: true,
      session,
      presentRecords: records,
      totalStudents: sectionStudents.length,
      presentCount: records.length,
      absentCount: sectionStudents.length - records.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/attendance/history
 * Attendance record history filtered by role
 */
router.get('/history', authenticateToken, (req, res) => {
  try {
    let sql = `
      SELECT r.*, s.section, subj.name as subject_name, subj.code as subject_code, u.name as student_name, u.college_id
      FROM attendance_records r
      JOIN attendance_sessions s ON r.session_id = s.id
      JOIN subjects subj ON s.subject_id = subj.id
      JOIN users u ON r.student_id = u.id
    `;

    const params = [];
    if (req.user.role === 'STUDENT') {
      sql += ' WHERE r.student_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'LECTURER') {
      sql += ' WHERE s.lecturer_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY r.timestamp DESC LIMIT 100';

    const history = db.prepare(sql).all(...params);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
