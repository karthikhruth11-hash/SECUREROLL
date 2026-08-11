import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAIDashboardInsights,
  processAIAssistantQuery,
  calculateAtRiskStudents,
  detectSecurityAnomalies
} from '../services/aiEngine.js';

const router = express.Router();

/**
 * GET /api/ai/insights
 */
router.get('/insights', authenticateToken, (req, res) => {
  try {
    const data = getAIDashboardInsights(req.user.role);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/ai/chat
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query string is required.' });
    }

    const response = await processAIAssistantQuery(query, req.user);
    res.json({ success: true, ...response });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/ai/predictions
 */
router.get('/predictions', authenticateToken, (req, res) => {
  try {
    const data = calculateAtRiskStudents();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/ai/anomalies
 */
router.get('/anomalies', authenticateToken, (req, res) => {
  try {
    const data = detectSecurityAnomalies();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
