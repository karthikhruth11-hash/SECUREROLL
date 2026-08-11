import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'SECURE_PLATFORM_ENTERPRISE_SECRET_KEY_2026';

// Add Audit Log Entry Helper
export const addAuditEntry = ({ actorId, actorRole, action, targetResource, details, status = 'SUCCESS', req }) => {
  try {
    const id = 'LOG-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || 'API_Client';
    const timestamp = new Date().toISOString();

    const raw = `${id}|${actorId}|${action}|${timestamp}`;
    const checksum = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);

    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_role, action, target_resource, details, status, ip_address, user_agent, checksum)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, actorId || 'SYSTEM', actorRole || 'GUEST', action, targetResource || null, details || null, status, ipAddress, userAgent, checksum);
    return id;
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
};

// Add Security Event Helper
export const addSecurityEvent = ({ userId, eventType, severity = 'LOW', details, req }) => {
  try {
    const id = 'SEC-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || '127.0.0.1';

    const stmt = db.prepare(`
      INSERT INTO security_events (id, user_id, event_type, severity, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId || null, eventType, severity, details, ipAddress);
    return id;
  } catch (err) {
    console.error('[SECURITY EVENT ERROR]', err);
  }
};

// Generate JWT Token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      collegeId: user.college_id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.department_id
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
};

// Authentication Middleware (Server Authorization Authority)
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication token required. Please sign in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists and is active in database
    const user = db.prepare('SELECT id, college_id, name, email, role, department_id, section, verification_status FROM users WHERE id = ?').get(decoded.id);

    if (!user || user.verification_status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Account is inactive or suspended.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_SESSION',
      message: 'Session has expired or token is invalid. Please log in again.'
    });
  }
};

// Role-Based Access Control (RBAC) Middleware
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    addSecurityEvent({
      userId: req.user.id,
      eventType: 'UNAUTHORIZED_RBAC_ATTEMPT',
      severity: 'HIGH',
      details: `User (${req.user.role}) attempted to access resource requiring roles: ${allowedRoles.join(', ')}`,
      req
    });

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: `Access denied. Requiring privilege levels: ${allowedRoles.join(', ')}`
    });
  };
};
