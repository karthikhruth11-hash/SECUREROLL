# SECURE — AI-Powered Enterprise College Identity, Attendance & Security Platform

SECURE is a production-grade, AI-enhanced enterprise platform designed for universities, colleges, and educational institutions to manage student identity, WebAuthn passkey biometrics, dynamic attendance verification, security monitoring, and administrative intelligence.

---

## Key Features & Architecture

- **Server-Side Verification Authority**: No fake authentication, no client-side role overrides, no simulated biometric timers. All security actions are cryptographically verified on the backend.
- **WebAuthn / Passkeys (FIDO2)**: Hardware-backed biometrics using Windows Hello, Apple Touch ID / Face ID, Android Fingerprint, or physical security keys via `@simplewebauthn`.
- **Honest Fallbacks**: If external integrations (e.g. SMS provider or AI API keys) are missing, SECURE explicitly displays `Service Configuration Required` instead of faking success.
- **Dynamic 15-Second QR Tokens**: Dynamic QR code rotation every 15 seconds prevents screenshot reuse and replay attacks.
- **AI Intelligence Engine**: Predicts at-risk students falling below the 75% threshold, detects security anomalies, and provides a permission-aware natural language AI Assistant.
- **Database Constraints**: Prevents duplicate attendance at the database level using `UNIQUE(session_id, student_id)` and SQLite WAL transactions.
- **SHA-256 Audit Trail**: Full audit logging with cryptographic checksums for security event monitoring.

---

## System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment template:

```bash
cp .env.example .env
```

### 3. Launching Backend & Database

Start the backend API server (runs SQLite WAL migrations & seeds default data automatically):

```bash
npm run server
```

The API server will start on `http://localhost:5000`.

### 4. Launching Frontend UI

In a separate terminal, launch the Vite frontend:

```bash
npm run dev
```

The web application will open on `http://localhost:5173`.

---

## Role-Based Access Control (RBAC) Matrix

| Feature / Endpoint | Super Admin (Creator) | Admin (Dean/HOD) | Lecturer | Student |
|---|:---:|:---:|:---:|:---:|
| User & Roster Management | ✅ | ✅ | ❌ | ❌ |
| CSV / Excel Data Import | ✅ | ✅ | ❌ | ❌ |
| Create Attendance Sessions | ✅ | ✅ | ✅ | ❌ |
| Dynamic QR Token View | ✅ | ✅ | ✅ | ❌ |
| Authenticate Attendance | ❌ | ❌ | ❌ | ✅ |
| Passkey & Device Security | ✅ | ✅ | ✅ | ✅ |
| Security Intelligence Logs | ✅ | ✅ | ❌ | ❌ |
| AI Assistant Queries | All Data | Institution Data | Course Data | Self Only |

---

## Running Security Tests

To execute the mandatory automated security failure test suite (verifying RBAC isolation, duplicate prevention, QR replay prevention, and SMS fallback):

```bash
npm run test:backend
```

---

## Production Deployment

1. **Build Production Asset Bundle**:
   ```bash
   npm run build
   ```
2. **Environment Variables**:
   Set `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` to your institution's HTTPS domain.
3. **Start Production Server**:
   ```bash
   NODE_ENV=production npm run server
   ```
