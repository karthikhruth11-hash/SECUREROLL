/**
 * SecureRoll - Security & Cryptographic Service
 * Provides AES-GCM 256 encryption, SHA-256 hashing, audit logging,
 * device lockout sentinel (5 failed attempts = 24hr freeze), and multi-device session checks.
 */

// Helper to convert ArrayBuffer to Hex String
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Helper to convert Hex String to Uint8Array
const hexToBuffer = (hex) => {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

// SHA-256 Hash Function
export const hashSHA256 = async (text) => {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return bufferToHex(hashBuffer);
};

// Derive Encryption Key from App Master Secret
const getEncryptionKey = async () => {
  const secret = "SecureRoll-Enterprise-Biometric-Key-2026";
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt sensitive text (e.g. Aadhar ID, Biometric Template string) using AES-GCM 256
 */
export const encryptSensitiveData = async (plainText) => {
  if (!plainText) return '';
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);
    
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return JSON.stringify({
      iv: bufferToHex(iv),
      cipher: bufferToHex(cipherBuffer)
    });
  } catch (err) {
    console.error("Encryption error:", err);
    return `[ENC-${plainText.substring(0, 4)}...]`;
  }
};

/**
 * Decrypt AES-GCM 256 encrypted payload
 */
export const decryptSensitiveData = async (encryptedJson) => {
  if (!encryptedJson) return '';
  try {
    const { iv, cipher } = typeof encryptedJson === 'string' ? JSON.parse(encryptedJson) : encryptedJson;
    const key = await getEncryptionKey();
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: hexToBuffer(iv) },
      key,
      hexToBuffer(cipher)
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption error:", err);
    return "[DECRYPTION_FAILED_OR_UNAUTHORIZED]";
  }
};

// Format Aadhar number for preview (e.g. 5432-xxxx-9876)
export const maskAadharID = (aadharStr) => {
  if (!aadharStr) return 'XXXX-XXXX-XXXX';
  const clean = aadharStr.replace(/\D/g, '');
  if (clean.length < 12) return 'XXXX-XXXX-' + clean.slice(-4);
  return `${clean.slice(0, 4)}-XXXX-${clean.slice(8, 12)}`;
};

/**
 * Audit Logging Service
 */
const AUDIT_LOG_KEY = 'secureroll_audit_logs';

export const getAuditLogs = () => {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addAuditLog = async ({ action, userId, userRole, orgId, details, status = 'SUCCESS' }) => {
  const logs = getAuditLogs();
  const timestamp = new Date().toISOString();
  const deviceId = localStorage.getItem('secureroll_device_id') || 'DEV-NODE-88219';
  const ipAddress = '192.168.1.104'; // Simulated local subnet IP

  const rawEntry = `${timestamp}|${action}|${userId || 'ANONYMOUS'}|${status}|${deviceId}`;
  const checksum = await hashSHA256(rawEntry);

  const newLog = {
    id: 'LOG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    timestamp,
    action,
    userId: userId || 'N/A',
    userRole: userRole || 'GUEST',
    orgId: orgId || 'GLOBAL',
    details,
    status,
    deviceId,
    ipAddress,
    checksum: checksum.slice(0, 16)
  };

  logs.unshift(newLog);
  // Keep last 300 logs
  if (logs.length > 300) logs.pop();
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  return newLog;
};

/**
 * Device Sentinel (Failed attempt tracker & 24-hr freeze)
 */
const DEVICE_ATTEMPTS_KEY = 'secureroll_device_attempts';

export const getDeviceLockoutStatus = () => {
  try {
    const data = JSON.parse(localStorage.getItem(DEVICE_ATTEMPTS_KEY) || '{}');
    const now = Date.now();
    
    if (data.frozenUntil && now < data.frozenUntil) {
      const remainingMs = data.frozenUntil - now;
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        isFrozen: true,
        failedCount: data.failedCount || 5,
        frozenUntil: data.frozenUntil,
        remainingText: `${remainingHours}h ${remainingMins}m`
      };
    }

    // Reset lockout if freeze window expired
    if (data.frozenUntil && now >= data.frozenUntil) {
      localStorage.removeItem(DEVICE_ATTEMPTS_KEY);
      return { isFrozen: false, failedCount: 0 };
    }

    return { isFrozen: false, failedCount: data.failedCount || 0 };
  } catch {
    return { isFrozen: false, failedCount: 0 };
  }
};

export const recordFailedAttempt = async (reason = 'Invalid Credentials / Biometric Match Failed') => {
  const current = getDeviceLockoutStatus();
  if (current.isFrozen) return current;

  const newCount = current.failedCount + 1;
  const deviceData = { failedCount: newCount };

  if (newCount >= 5) {
    // Freeze for 24 hours (24 * 60 * 60 * 1000 ms)
    const frozenUntil = Date.now() + 24 * 60 * 60 * 1000;
    deviceData.frozenUntil = frozenUntil;

    await addAuditLog({
      action: 'DEVICE_FREEZE_TRIGGERED',
      userId: 'UNAUTHORIZED_ATTEMPT',
      userRole: 'SYSTEM',
      details: `5 consecutive failed security checks reached. Device locked out for 24 hours. Reason: ${reason}`,
      status: 'BLOCKED'
    });
  } else {
    await addAuditLog({
      action: 'SECURITY_CHECK_FAILED',
      userId: 'UNAUTHORIZED_ATTEMPT',
      userRole: 'GUEST',
      details: `Failed attempt ${newCount}/5. Reason: ${reason}`,
      status: 'FAILED'
    });
  }

  localStorage.setItem(DEVICE_ATTEMPTS_KEY, JSON.stringify(deviceData));
  return getDeviceLockoutStatus();
};

export const resetDeviceAttempts = () => {
  localStorage.removeItem(DEVICE_ATTEMPTS_KEY);
};

/**
 * Multi-device Session Enforcement
 */
export const setActiveSessionToken = (userId) => {
  const sessionToken = 'SESS-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
  const sessionMap = JSON.parse(localStorage.getItem('secureroll_active_sessions') || '{}');
  sessionMap[userId] = {
    token: sessionToken,
    loginTime: new Date().toISOString(),
    deviceId: localStorage.getItem('secureroll_device_id') || 'DEV-MAIN'
  };
  localStorage.setItem('secureroll_active_sessions', JSON.stringify(sessionMap));
  localStorage.setItem('secureroll_current_session_token', sessionToken);
  return sessionToken;
};

export const validateActiveSession = (userId) => {
  if (!userId) return false;
  const currentToken = localStorage.getItem('secureroll_current_session_token');
  const sessionMap = JSON.parse(localStorage.getItem('secureroll_active_sessions') || '{}');
  const userSession = sessionMap[userId];
  
  if (!userSession || !currentToken) return true; // Default allow if fresh
  return userSession.token === currentToken;
};
