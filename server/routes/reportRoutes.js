import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole, addAuditEntry } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/reports/summary
 */
router.get('/summary', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'HOD', 'LECTURER']), (req, res) => {
  try {
    const { departmentId, section, startDate, endDate } = req.query;

    let sql = `
      SELECT r.id, r.timestamp, r.status, r.verification_method,
      s.section, subj.name as subject_name, subj.code as subject_code,
      u.name as student_name, u.college_id, u.email, d.name as department_name
      FROM attendance_records r
      JOIN attendance_sessions s ON r.session_id = s.id
      JOIN subjects subj ON s.subject_id = subj.id
      JOIN users u ON r.student_id = u.id
      JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;

    const params = [];
    if (departmentId) {
      sql += ' AND s.department_id = ?';
      params.push(departmentId);
    }
    if (section) {
      sql += ' AND s.section = ?';
      params.push(section);
    }
    if (startDate) {
      sql += ' AND r.timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND r.timestamp <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY r.timestamp DESC';

    const records = db.prepare(sql).all(...params);

    addAuditEntry({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'REPORT_GENERATED',
      details: `Generated attendance summary report (${records.length} records)`,
      req
    });

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name,
      totalRecords: records.length,
      records
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
