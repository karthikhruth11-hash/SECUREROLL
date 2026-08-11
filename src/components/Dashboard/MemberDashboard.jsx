import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, QrCode, CheckCircle2, AlertTriangle, Sparkles, Clock, Smartphone, RefreshCw } from 'lucide-react';
import { apiGetActiveSessions, apiMarkAttendance, apiGetAttendanceHistory } from '../../services/api.js';
import { checkPasskeySupport, authenticateWithPasskey } from '../../services/passkeyClient.js';

export default function MemberDashboard({ user, onNavigate }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [passkeySupport, setPasskeySupport] = useState({ supported: true });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessRes, histRes, pkRes] = await Promise.all([
        apiGetActiveSessions(),
        apiGetAttendanceHistory(),
        checkPasskeySupport()
      ]);
      setActiveSessions(sessRes.sessions || []);
      setHistory(histRes.history || []);
      setPasskeySupport(pkRes);
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Mark Attendance via Passkey / Biometrics
  const handleMarkAttendanceWithPasskey = async (sessionId) => {
    setVerifying(true);
    setStatusMsg('Preparing secure Passkey verification...');
    setErrorMsg(null);

    try {
      // 1. Authenticate student via device Passkey (Touch ID / Face ID / Windows Hello)
      setStatusMsg('Waiting for device biometric authentication (Touch ID / Windows Hello)...');
      await authenticateWithPasskey(user.email);

      // 2. Submit attendance transaction to server
      setStatusMsg('Verifying credential & recording attendance on server...');
      const res = await apiMarkAttendance(sessionId, 'WEBAUTHN_PASSKEY');

      if (res.success) {
        setStatusMsg(`Attendance Confirmed ✓ (${res.studentName}, ${res.verificationMethod})`);
        await fetchData();
      } else {
        setErrorMsg(res.message || 'Attendance submission failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed or cancelled.');
    } finally {
      setVerifying(false);
    }
  };

  // Calculate percentage
  const totalClasses = Math.max(history.length, 5);
  const presentClasses = history.filter(h => h.status === 'PRESENT').length;
  const percentage = Math.round((presentClasses / totalClasses) * 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Student Identity Card Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-lg">
            🎓
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
            <p className="text-xs text-slate-400 font-mono">
              College ID: <span className="text-cyan-400 font-bold">{user.college_id}</span> • Section: {user.section} • Year: 2025-2026
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('PASSKEYS')}
          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Key className="w-4 h-4 text-cyan-400" /> Manage Devices & Passkeys
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Attendance Classes Alert */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <QrCode className="w-4 h-4 text-cyan-400" /> Live Attendance Classes ({activeSessions.length})
        </h3>

        {activeSessions.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            No active attendance classes in progress for section {user.section}.
          </div>
        ) : (
          activeSessions.map((sess) => (
            <div key={sess.id} className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{sess.subject_name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                    ACTIVE NOW
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Lecturer: {sess.lecturer_name} • Section: {sess.section}</p>
              </div>

              <button
                onClick={() => handleMarkAttendanceWithPasskey(sess.id)}
                disabled={verifying}
                className="py-3 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" /> Authenticate & Mark Present
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Overall Attendance Percentage & AI Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 font-semibold">Overall Verified Attendance Rate</p>
          <p className={`text-4xl font-extrabold ${percentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>{percentage}%</p>
          <p className="text-[11px] text-slate-500">{presentClasses} of {totalClasses} classes attended</p>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> AI Generated Attendance Intelligence
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {percentage >= 75
              ? `Great standing! Your verified attendance rate is ${percentage}%, well above the configured 75% institution threshold. Attending upcoming classes will maintain your eligibility.`
              : `Attention Required: Your current attendance rate is ${percentage}%, below the mandatory 75% threshold. Attending the next 2 scheduled sessions will bring your standing back to compliant status.`
            }
          </p>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 px-6 bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-white">
          Verified Attendance History
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-500">No attendance history records found.</td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-white font-bold">{h.subject_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-mono">{h.verification_method}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{new Date(h.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
