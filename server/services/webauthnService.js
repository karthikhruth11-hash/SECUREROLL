import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import db from '../db/database.js';
import crypto from 'crypto';

const RP_NAME = 'SECURE Platform';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const EXPECTED_ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

// In-memory challenge storage for pending assertions
const challengeStore = new Map();

/**
 * Generate Registration Options for WebAuthn / Passkey creation
 */
export const getPasskeyRegistrationOptions = async (user) => {
  const userPasskeys = db.prepare('SELECT credential_id FROM passkeys WHERE user_id = ?').all(user.id);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(user.id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    excludeCredentials: userPasskeys.map(pk => ({
      id: pk.credential_id,
      type: 'public-key'
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred'
    }
  });

  // Store challenge mapped to user.id
  challengeStore.set(`reg_${user.id}`, options.challenge);
  return options;
};

/**
 * Verify WebAuthn Registration Assertion
 */
export const verifyPasskeyRegistration = async (user, credential, deviceName = 'Primary Device', reqInfo = {}) => {
  const expectedChallenge = challengeStore.get(`reg_${user.id}`);
  if (!expectedChallenge) {
    throw new Error('Registration challenge expired or missing. Please try again.');
  }

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge,
    expectedOrigin: EXPECTED_ORIGIN,
    expectedRPID: RP_ID
  });

  challengeStore.delete(`reg_${user.id}`);

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Cryptographic passkey registration verification failed.');
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
  const passkeyId = 'PK-' + crypto.randomBytes(6).toString('hex').toUpperCase();

  // Save Passkey in DB
  const stmt = db.prepare(`
    INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, transports, device_name, platform, browser, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const credentialIdBase64 = Buffer.from(credentialID).toString('base64url');
  const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64url');
  const transports = credential.response.transports ? credential.response.transports.join(',') : 'internal';

  stmt.run(
    passkeyId,
    user.id,
    credentialIdBase64,
    publicKeyBase64,
    counter,
    transports,
    deviceName,
    reqInfo.platform || 'Platform Authenticator',
    reqInfo.browser || 'Browser',
    new Date().toISOString()
  );

  // Update user biometrics_enrolled status
  db.prepare('UPDATE users SET biometrics_enrolled = 1 WHERE id = ?').run(user.id);

  return {
    success: true,
    passkeyId,
    deviceName,
    message: 'Passkey registered successfully.'
  };
};

/**
 * Generate Authentication Options for WebAuthn / Passkey Login
 */
export const getPasskeyAuthOptions = async (emailOrCollegeId = null) => {
  let userPasskeys = [];
  if (emailOrCollegeId) {
    const user = db.prepare('SELECT id FROM users WHERE email = ? OR college_id = ?').get(emailOrCollegeId, emailOrCollegeId);
    if (user) {
      userPasskeys = db.prepare('SELECT credential_id FROM passkeys WHERE user_id = ?').all(user.id);
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
    allowCredentials: userPasskeys.map(pk => ({
      id: pk.credential_id,
      type: 'public-key'
    }))
  });

  const challengeId = crypto.randomBytes(8).toString('hex');
  challengeStore.set(`auth_${challengeId}`, options.challenge);

  return { options, challengeId };
};

/**
 * Verify WebAuthn Authentication Assertion
 */
export const verifyPasskeyAuth = async (challengeId, credential) => {
  const expectedChallenge = challengeStore.get(`auth_${challengeId}`);
  if (!expectedChallenge) {
    throw new Error('Authentication challenge expired or invalid.');
  }

  // Find passkey record by credential_id
  const credentialIdBase64 = credential.id;
  const passkey = db.prepare('SELECT * FROM passkeys WHERE credential_id = ?').get(credentialIdBase64);

  if (!passkey) {
    throw new Error('Passkey credential not registered in SECURE database.');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(passkey.user_id);
  if (!user) {
    throw new Error('Associated user account not found.');
  }

  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge,
    expectedOrigin: EXPECTED_ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: Buffer.from(passkey.credential_id, 'base64url'),
      credentialPublicKey: Buffer.from(passkey.public_key, 'base64url'),
      counter: passkey.counter
    }
  });

  challengeStore.delete(`auth_${challengeId}`);

  if (!verification.verified) {
    throw new Error('Passkey cryptographic signature verification failed.');
  }

  // Update passkey counter and last used timestamp
  db.prepare('UPDATE passkeys SET counter = ?, last_used_at = ? WHERE id = ?').run(
    verification.authenticationInfo.newCounter,
    new Date().toISOString(),
    passkey.id
  );

  return { verified: true, user, passkey };
};
