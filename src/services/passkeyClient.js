import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import {
  apiGetPasskeyRegOptions,
  apiVerifyPasskeyReg,
  apiGetPasskeyAuthOptions,
  apiVerifyPasskeyAuth
} from './api.js';

/**
 * Check if Browser & Platform support WebAuthn / Passkeys
 */
export const checkPasskeySupport = async () => {
  if (!window.PublicKeyCredential) {
    return { supported: false, reason: 'Browser does not support WebAuthn API.' };
  }

  try {
    const isPlatformAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      supported: true,
      platformAuthenticatorAvailable: isPlatformAvailable,
      message: isPlatformAvailable
        ? 'Platform biometric authentication supported (Touch ID, Face ID, Windows Hello).'
        : 'WebAuthn supported via external security keys or device PIN.'
    };
  } catch {
    return { supported: true, platformAuthenticatorAvailable: false, message: 'WebAuthn supported.' };
  }
};

/**
 * Register a new Passkey on device
 */
export const registerNewPasskey = async (deviceName = 'Primary Device') => {
  try {
    // 1. Get options from server
    const { options } = await apiGetPasskeyRegOptions();

    // 2. Trigger browser WebAuthn prompt
    const attestation = await startRegistration(options);

    // 3. Send assertion back to server for cryptographic verification
    const result = await apiVerifyPasskeyReg(attestation, deviceName);
    return result;
  } catch (err) {
    console.error('[PASSKEY REGISTRATION ERROR]', err);
    if (err.name === 'NotAllowedError') {
      throw new Error('Passkey creation cancelled or timed out.');
    }
    throw new Error(err.message || 'Failed to register passkey credential.');
  }
};

/**
 * Perform Passkey Login / Authentication
 */
export const authenticateWithPasskey = async (emailOrCollegeId = null) => {
  try {
    // 1. Get options from server
    const { options, challengeId } = await apiGetPasskeyAuthOptions(emailOrCollegeId);

    // 2. Trigger browser WebAuthn authentication prompt
    const assertion = await startAuthentication(options);

    // 3. Send assertion back to server for cryptographic verification
    const result = await apiVerifyPasskeyAuth(challengeId, assertion);
    return result;
  } catch (err) {
    console.error('[PASSKEY AUTHENTICATION ERROR]', err);
    if (err.name === 'NotAllowedError') {
      throw new Error('Passkey authentication cancelled or timed out.');
    }
    throw new Error(err.message || 'Passkey verification failed.');
  }
};
