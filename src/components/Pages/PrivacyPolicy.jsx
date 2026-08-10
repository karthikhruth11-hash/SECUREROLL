import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, Server, Award, ChevronLeft } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:underline"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
        
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Data Privacy & Protection Policy</h1>
            <p className="text-xs text-slate-400">Compliance with Digital Personal Data Protection (DPDP) Act 2023 & GDPR Standards</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed space-y-6">
          
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" /> 1. Biometric & Aadhar Data Encryption
            </h3>
            <p>
              SecureRoll prioritizes member data privacy. All sensitive personal identity records—including 12-digit Aadhar ID numbers, facial recognition landmark vector arrays, and optical fingerprint minutiae templates—are cryptographically encrypted using <strong>AES-256 GCM (Galois/Counter Mode)</strong> algorithm prior to persistent storage. Raw biometric images or full Aadhar numbers are never stored in plain text.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" /> 2. Access Control & Device Restriction
            </h3>
            <p>
              Decryption of sensitive fields is restricted exclusively to authorized enterprise admin devices via authenticated session keys. SecureRoll enforces a strict <strong>single-active-session policy</strong> per user account across devices to prevent credentials sharing.
            </p>
            <p>
              Furthermore, an automated <strong>Device Sentinel</strong> blocks device access for 24 hours if 5 consecutive unauthorized attempts or failed biometric scans are detected.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" /> 3. Geolocation & Attendance Verification
            </h3>
            <p>
              GPS geolocation coordinates gathered during attendance scans are used strictly to validate physical presence within official college or corporate campus premises. Geolocation data is non-persistently matched against the organization's geo-fence bounds and is not used for continuous location tracking.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> 4. Audit Logging & Immutable Hash Verification
            </h3>
            <p>
              All system operations—including member registrations, biometric verifications, attendance kiosk scans, leave approvals, and admin data exports—are logged in a cryptographically signed, immutable audit log containing SHA-256 checksum hashes for full accountability.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs space-y-2">
            <h4 className="font-bold flex items-center gap-2 text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Consent & Member Rights Statement
            </h4>
            <p>
              By enrolling in SecureRoll, members provide explicit consent for biometric verification and identity processing for organizational attendance management. Members reserve the right to request data audit reports or request biometric re-enrollment through their organization administrator.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
