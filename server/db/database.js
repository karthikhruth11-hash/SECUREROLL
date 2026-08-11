import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'secureroll.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Initialize SQLite database connection
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Helper to hash password with SHA-256 (or bcrypt)
export const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + 'SECURE_ROLL_SALT_2026').digest('hex');
};

// Run Schema DDL
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

// Seed Database if Users Table is Empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  console.log('[SECURE DB] Seeding enterprise college database with default data...');

  const insertDept = db.prepare('INSERT INTO departments (id, name, code, hod_name) VALUES (?, ?, ?, ?)');
  const insertCourse = db.prepare('INSERT INTO courses (id, department_id, name, code, duration_years) VALUES (?, ?, ?, ?, ?)');
  const insertSubject = db.prepare('INSERT INTO subjects (id, course_id, name, code, semester) VALUES (?, ?, ?, ?, ?)');
  const insertUser = db.prepare('INSERT INTO users (id, college_id, name, email, phone, password_hash, role, department_id, section, academic_year, biometrics_enrolled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  // 1. Departments
  insertDept.run('DEPT-CSE', 'Computer Science & Engineering', 'CSE', 'Dr. Aristhotle Sen');
  insertDept.run('DEPT-ECE', 'Electronics & Communication Engineering', 'ECE', 'Dr. Meera Vasudevan');
  insertDept.run('DEPT-MECH', 'Mechanical Engineering', 'MECH', 'Dr. Vikramaditya Rao');

  // 2. Courses
  insertCourse.run('CRS-BTECH-CSE', 'DEPT-CSE', 'B.Tech Computer Science & Engineering', 'CSE-BTECH', 4);
  insertCourse.run('CRS-BTECH-ECE', 'DEPT-ECE', 'B.Tech Electronics & Communication', 'ECE-BTECH', 4);

  // 3. Subjects
  insertSubject.run('SUB-CS301', 'CRS-BTECH-CSE', 'Data Structures & Algorithms', 'CS301', 3);
  insertSubject.run('SUB-CS302', 'CRS-BTECH-CSE', 'Database Management Systems', 'CS302', 3);
  insertSubject.run('SUB-EC201', 'CRS-BTECH-ECE', 'Digital Signal Processing', 'EC201', 4);

  // 4. Users (Super Admin, Admins, HOD, Lecturers, Students)
  const defaultPassHash = hashPassword('Admin@123');
  const studentPassHash = hashPassword('Student@123');

  // Creator / Super Admin (Karthik)
  insertUser.run(
    'USR-SUPER-01',
    'COL-SA-001',
    'Karthik (Creator & System Admin)',
    'karthik@secureroll.edu',
    '+919876543210',
    defaultPassHash,
    'SUPER_ADMIN',
    'DEPT-CSE',
    'ADMIN',
    '2025-2026',
    1
  );

  // Admin
  insertUser.run(
    'USR-ADMIN-01',
    'COL-ADM-002',
    'Dr. Rajesh Vardhan (Dean Academic)',
    'admin@secureroll.edu',
    '+919876543211',
    defaultPassHash,
    'ADMIN',
    'DEPT-CSE',
    'ADMIN',
    '2025-2026',
    1
  );

  // HOD
  insertUser.run(
    'USR-HOD-01',
    'COL-HOD-003',
    'Dr. Aristhotle Sen (HOD CSE)',
    'hod.cse@secureroll.edu',
    '+919876543212',
    defaultPassHash,
    'HOD',
    'DEPT-CSE',
    'HOD',
    '2025-2026',
    1
  );

  // Lecturer
  insertUser.run(
    'USR-LEC-01',
    'COL-FAC-101',
    'Prof. Sunita Sharma (Lecturer CSE)',
    'sunita.sharma@secureroll.edu',
    '+919876543213',
    defaultPassHash,
    'LECTURER',
    'DEPT-CSE',
    'FACULTY',
    '2025-2026',
    1
  );

  // Students
  const students = [
    { id: 'USR-STU-01', collegeId: '2024-CSE-108', name: 'Rohit Sharma', email: 'rohit.sharma@secureroll.edu', section: 'CSE-A' },
    { id: 'USR-STU-02', collegeId: '2024-CSE-109', name: 'Ananya Roy', email: 'ananya.roy@secureroll.edu', section: 'CSE-A' },
    { id: 'USR-STU-03', collegeId: '2024-CSE-110', name: 'Devansh Verma', email: 'devansh.verma@secureroll.edu', section: 'CSE-A' },
    { id: 'USR-STU-04', collegeId: '2024-CSE-111', name: 'Kavya Nair', email: 'kavya.nair@secureroll.edu', section: 'CSE-B' },
    { id: 'USR-STU-05', collegeId: '2024-CSE-112', name: 'Aditya Kapoor', email: 'aditya.kapoor@secureroll.edu', section: 'CSE-B' }
  ];

  for (const s of students) {
    insertUser.run(
      s.id,
      s.collegeId,
      s.name,
      s.email,
      '+919811122233',
      studentPassHash,
      'STUDENT',
      'DEPT-CSE',
      s.section,
      '2025-2026',
      1
    );
  }

  // 5. Attendance Session (Active for demonstration)
  const insertSession = db.prepare('INSERT INTO attendance_sessions (id, subject_id, lecturer_id, department_id, section, start_time, end_time, status, dynamic_token, verification_policy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  const now = new Date();
  const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour active

  insertSession.run(
    'SESS-LIVE-01',
    'SUB-CS301',
    'USR-LEC-01',
    'DEPT-CSE',
    'CSE-A',
    now.toISOString(),
    endTime.toISOString(),
    'ACTIVE',
    crypto.randomBytes(16).toString('hex'),
    'PASSKEY_OR_OTP'
  );

  // 6. Seed Attendance Records
  const insertRecord = db.prepare('INSERT INTO attendance_records (id, session_id, student_id, status, verification_method, confidence_score, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertRecord.run('ATT-REC-01', 'SESS-LIVE-01', 'USR-STU-01', 'PRESENT', 'WEBAUTHN_PASSKEY', 99, new Date().toISOString());

  // 7. Seed Initial Audit Log
  const insertAudit = db.prepare('INSERT INTO audit_logs (id, actor_id, actor_role, action, target_resource, details, checksum) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertAudit.run(
    'LOG-INIT-01',
    'USR-SUPER-01',
    'SUPER_ADMIN',
    'SYSTEM_BOOTSTRAP',
    'DATABASE',
    'SECURE platform initial database schema & enterprise seed deployed.',
    crypto.createHash('sha256').update('LOG-INIT-01|SYSTEM_BOOTSTRAP').digest('hex').substring(0, 16)
  );

  console.log('[SECURE DB] Enterprise database successfully initialized and seeded!');
}

export default db;
