import express from 'express';
import db, { hashPassword } from '../db/database.js';
import { generateToken, authenticateToken, addAuditEntry, addSecurityEvent } from '../middleware/auth.js';
import {
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getPasskeyAuthOptions,
  verifyPasskeyAuth
} from '../services/webauthnService.js';
import { generateSMSOTP, verifySMSOTP, getSMSProviderStatus } from '../services/otpService.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Standard Credentials Authentication
 */
router.post('/login', (req, res) => {
  const { emailOrCollegeId, password } = req.body;

  if (!emailOrCollegeId || !password) {
    return res.status(400).json({ success: false, message: 'Email / College ID and Password are required.' });
  }

  const cleanInput = emailOrCollegeId.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ? OR lower(college_id) = ?').get(cleanInput, cleanInput);

  if (!user) {
    addSecurityEvent({
      userId: null,
      eventType: 'FAILED_LOGIN_UNKNOWN_USER',
      severity: 'LOW',
      details: `Failed login attempt for unknown identifier: ${emailOrCollegeId}`,
      req
    });
    return res.status(401).json({ success: false, message: 'Invalid credentials. Check your email/college ID or password.' });
  }

  const inputHash = hashPassword(password);
  if (user.password_hash !== inputHash) {
    addSecurityEvent({
      userId: user.id,
      eventType: 'FAILED_LOGIN_PASSWORD_MISMATCH',
      severity: 'MEDIUM',
      details: `Password mismatch for user ${user.email}`,
      req
    });
    return res.status(401).json({ success: false, message: 'Invalid credentials. Check your email/college ID or password.' });
  }

  const token = generateToken(user);

  addAuditEntry({
    actorId: user.id,
    actorRole: user.role,
    action: 'USER_LOGIN_SUCCESS',
    targetResource: user.id,
    details: 'User authenticated via password.',
    req
  });

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      collegeId: user.college_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      departmentId: user.department_id,
      section: user.section,
      biometricsEnrolled: Boolean(user.biometrics_enrolled)
    }
  });
});

/**
 * GET /api/auth/me
 * Validate current session token
 */
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, college_id, name, email, phone, role, department_id, section, biometrics_enrolled FROM users WHERE id = ?').get(req.user.id);
  return res.json({ success: true, user });
});

/**
 * WebAuthn Passkey Routes
 */
router.post('/passkey/register-options', authenticateToken, async (req, res) => {
  try {
    const options = await getPasskeyRegistrationOptions(req.user);
    res.json({ success: true, options });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/passkey/verify-registration', authenticateToken, async (req, res) => {
  try {
    const { credential, deviceName } = req.body;
    const result = await verifyPasskeyRegistration(req.user, credential, deviceName, {
      platform: req.headers['user-agent']
    });

    addAuditEntry({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'PASSKEY_REGISTERED',
      details: `Registered passkey: ${deviceName}`,
      req
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/passkey/auth-options', async (req, res) => {
  try {
    const { emailOrCollegeId } = req.body;
    const { options, challengeId } = await getPasskeyAuthOptions(emailOrCollegeId);
    res.json({ success: true, options, challengeId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/passkey/verify-auth', async (req, res) => {
  try {
    const { challengeId, credential } = req.body;
    const { verified, user } = await verifyPasskeyAuth(challengeId, credential);

    if (!verified || !user) {
      return res.status(401).json({ success: false, message: 'Passkey verification failed.' });
    }

    const token = generateToken(user);

    addAuditEntry({
      actorId: user.id,
      actorRole: user.role,
      action: 'PASSKEY_LOGIN_SUCCESS',
      details: 'User authenticated via WebAuthn passkey assertion.',
      req
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        collegeId: user.college_id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.department_id,
        section: user.section
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * SMS OTP Routes
 */
router.get('/otp/status', (req, res) => {
  res.json(getSMSProviderStatus());
});

router.post('/otp/request', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await generateSMSOTP(req.user, phone);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/otp/verify', authenticateToken, async (req, res) => {
  try {
    const { otpInput } = req.body;
    const result = await verifySMSOTP(req.user, otpInput);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
