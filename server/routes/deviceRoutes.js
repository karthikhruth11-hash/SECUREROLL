import express from 'express';
import db from '../db/database.js';
import { authenticateToken, addAuditEntry } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/devices/passkeys
 * Get registered Passkeys for current user
 */
router.get('/passkeys', authenticateToken, (req, res) => {
  try {
    const passkeys = db.prepare(`
      SELECT id, credential_id, device_name, platform, browser, counter, transports, last_used_at, created_at
      FROM passkeys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ success: true, passkeys });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/devices/passkey/:id
 * Revoke specific registered passkey
 */
router.delete('/passkey/:id', authenticateToken, (req, res) => {
  try {
    const passkey = db.prepare('SELECT * FROM passkeys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!passkey) {
      return res.status(404).json({ success: false, message: 'Passkey credential not found or not owned by user.' });
    }

    db.prepare('DELETE FROM passkeys WHERE id = ?').run(req.params.id);

    // Update biometrics_enrolled if zero passkeys remain
    const remaining = db.prepare('SELECT COUNT(*) as count FROM passkeys WHERE user_id = ?').get(req.user.id).count;
    if (remaining === 0) {
      db.prepare('UPDATE users SET biometrics_enrolled = 0 WHERE id = ?').run(req.user.id);
    }

    addAuditEntry({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'PASSKEY_REVOKED',
      details: `Revoked passkey credential: ${passkey.device_name}`,
      req
    });

    res.json({ success: true, message: 'Passkey credential successfully revoked.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/devices/sessions
 * List active user devices and sessions
 */
router.get('/sessions', authenticateToken, (req, res) => {
  try {
    const devices = db.prepare('SELECT * FROM user_devices WHERE user_id = ? ORDER BY last_active_at DESC').all(req.user.id);
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/devices/revoke-all
 * Revoke all active device sessions for current user
 */
router.post('/revoke-all', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM user_devices WHERE user_id = ?').run(req.user.id);

    addAuditEntry({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'ALL_DEVICES_REVOKED',
      details: 'User invoked emergency logout from all active devices and sessions.',
      req
    });

    res.json({ success: true, message: 'All active device sessions have been revoked.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
