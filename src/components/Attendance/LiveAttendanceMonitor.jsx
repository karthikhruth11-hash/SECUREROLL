import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, Clock, ShieldCheck, QrCode, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiGetLiveSession } from '../../services/api.js';

export default function LiveAttendanceMonitor({ sessionId, onBack, onShowQR }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    if (!sessionId) return;
    try {
      const res = await apiGetLiveSession(sessionId);
      setData(res);
    } catch (err) {
      console.error('Failed to load live monitor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 5000); // 5s refresh
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-xs text-cyan-400 font-mono flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Initializing Live Class Telemetry Stream...
      </div>
    );
  }

  const { session, presentRecords, totalStudents, presentCount, absentCount } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{session.subject_name} ({session.section})</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                LIVE SESSION ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">Class Session ID: {session.id} • Policy: {session.verification_policy}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onShowQR}
            className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <QrCode className="w-4 h-4" /> Show Dynamic QR
          </button>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" /> Total Section Capacity
          </p>
          <p className="text-2xl font-extrabold text-white">{totalStudents} Enrolled</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Present Today
          </p>
          <p className="text-2xl font-extrabold text-emerald-400">{presentCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" /> Pending / Absent
          </p>
          <p className="text-2xl font-extrabold text-amber-400">{absentCount}</p>
        </div>
      </div>

      {/* Live Verifications Stream Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 px-6 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Real-time Biometric & Passkey Verifications</span>
          <span>Auto-refreshes every 5 seconds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">College ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Verification Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {presentRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    Waiting for students to join and authenticate...
                  </td>
                </tr>
              ) : (
                presentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-bold">{r.student_name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{r.college_id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">
                        VERIFIED PRESENT
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-mono text-[11px]">{r.verification_method}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{new Date(r.timestamp).toLocaleTimeString()}</td>
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
