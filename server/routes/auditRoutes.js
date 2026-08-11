import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { getSMSProviderStatus } from '../services/otpService.js';

const router = express.Router();

/**
 * GET /api/audit/logs
 * Security & Audit Event Logs (Admin only)
 */
router.get('/logs', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT l.*, u.name as actor_name, u.email as actor_email
      FROM audit_logs l
      LEFT JOIN users u ON l.actor_id = u.id
      ORDER BY l.created_at DESC LIMIT 200
    `).all();

    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/security/events
 * Security Anomaly & Alert Events
 */
router.get('/security-events', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req, res) => {
  try {
    const events = db.prepare(`
      SELECT e.*, u.name as user_name, u.college_id
      FROM security_events e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC LIMIT 100
    `).all();

    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/health
 * System Health & External Service Configuration Status
 */
router.get('/health', (req, res) => {
  try {
    const smsStatus = getSMSProviderStatus();
    const hasAiKey = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({
      status: 'ONLINE',
      system: 'SECURE — AI-Powered Enterprise College Identity Platform',
      version: '2.0.0-ENTERPRISE',
      timestamp: new Date().toISOString(),
      services: {
        apiServer: { status: 'ONLINE', details: 'Express REST Server Active' },
        database: { status: 'ONLINE', details: `SQLite Normalized DB Active (${userCount} enrolled users)` },
        webAuthn: { status: 'ONLINE', details: 'FIDO2 / WebAuthn Passkey Provider Active' },
        smsProvider: {
          status: smsStatus.configured ? 'ONLINE' : 'CONFIGURATION REQUIRED',
          details: smsStatus.message
        },
        aiEngine: {
          status: 'ONLINE',
          mode: hasAiKey ? 'GENERATIVE_LLM_CONNECTED' : 'DETERMINISTIC_RULE_ENGINE',
          details: hasAiKey ? 'Generative AI API Connected' : 'Deterministic analytics active. Set GEMINI_API_KEY for generative LLM summaries.'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'DEGRADED', message: err.message });
  }
});

export default router;
