import express from 'express';
import db, { hashPassword } from '../db/database.js';
import { authenticateToken, requireRole, addAuditEntry } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * GET /api/users
 * List all users with RBAC restrictions
 */
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'HOD', 'LECTURER']), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.college_id, u.name, u.email, u.phone, u.role, u.department_id, u.section, u.academic_year, u.verification_status, u.biometrics_enrolled, u.created_at,
      d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `).all();

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/users/create
 * Create new user manually (Admin only)
 */
router.post('/create', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
  try {
    const { collegeId, name, email, phone, role, departmentId, section, academicYear, password } = req.body;

    if (!collegeId || !name || !email || !role) {
      return res.status(400).json({ success: false, message: 'College ID, Name, Email, and Role are required.' });
    }

    const userId = 'USR-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const passHash = hashPassword(password || 'Student@123');

    const stmt = db.prepare(`
      INSERT INTO users (id, college_id, name, email, phone, password_hash, role, department_id, section, academic_year, biometrics_enrolled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(userId, collegeId, name, email.toLowerCase(), phone || null, passHash, role, departmentId || 'DEPT-CSE', section || 'CSE-A', academicYear || '2025-2026');

    addAuditEntry({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'USER_CREATED',
      targetResource: userId,
      details: `Admin created user ${name} (${collegeId}) as ${role}`,
      req
    });

    res.json({ success: true, userId, message: 'User created successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/users/import
 * Enterprise CSV/Excel College Data Importer
 */
router.post('/import', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
  try {
    const { rows } = req.body; // Array of objects parsed from CSV/Excel
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Import payload must be a non-empty array of records.' });
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    const insertStmt = db.prepare(`
      INSERT INTO users (id, college_id, name, email, phone, password_hash, role, department_id, section, academic_year, biometrics_enrolled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const defaultPassHash = hashPassword('College@123');

    // Run import inside a DB Transaction for full atomicity
    const transaction = db.transaction((records) => {
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const collegeId = row.collegeId || row['Student ID'] || row['Roll No'] || row['College ID'];
        const name = row.name || row['Name'] || row['Student Name'];
        const email = row.email || row['Email'] || row['Email Address'];

        if (!collegeId || !name || !email) {
          skippedCount++;
          errors.push(`Row ${i + 1}: Missing College ID, Name, or Email.`);
          continue;
        }

        const existing = db.prepare('SELECT id FROM users WHERE college_id = ? OR email = ?').get(collegeId, email.toLowerCase());
        if (existing) {
          skippedCount++;
          errors.push(`Row ${i + 1}: Record with College ID ${collegeId} or Email ${email} already exists.`);
          continue;
        }

        const id = 'USR-IMP-' + crypto.randomBytes(5).toString('hex').toUpperCase();
        insertStmt.run(
          id,
          collegeId,
          name,
          email.toLowerCase(),
          row.phone || row['Phone'] || null,
          defaultPassHash,
          row.role || 'STUDENT',
          row.departmentId || 'DEPT-CSE',
          row.section || 'CSE-A',
          row.academicYear || '2025-2026'
        );

        insertedCount++;
      }
    });

    transaction(rows);

    addAuditEntry({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'COLLEGE_DATA_IMPORTED',
      details: `Import completed. ${insertedCount} inserted, ${skippedCount} skipped.`,
      req
    });

    res.json({
      success: true,
      insertedCount,
      skippedCount,
      errors,
      message: `Import processed: ${insertedCount} users added successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/departments
 */
router.get('/departments', authenticateToken, (req, res) => {
  try {
    const departments = db.prepare('SELECT * FROM departments').all();
    res.json({ success: true, departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/courses
 */
router.get('/courses', authenticateToken, (req, res) => {
  try {
    const courses = db.prepare('SELECT c.*, d.name as department_name FROM courses c JOIN departments d ON c.department_id = d.id').all();
    const subjects = db.prepare('SELECT s.*, c.name as course_name FROM subjects s JOIN courses c ON s.course_id = c.id').all();
    res.json({ success: true, courses, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
