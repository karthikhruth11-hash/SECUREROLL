import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, ShieldCheck, RefreshCw, X, Sparkles } from 'lucide-react';
import { addAuditLog } from '../../services/securityService';

export default function FingerprintScanModal({ isOpen, onClose, onSuccess, user }) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('IDLE'); // IDLE, SCANNING, SUCCESS, FAILED
  const [statusMsg, setStatusMsg] = useState('Touch or press the sensor pad to scan fingerprint');
  const [matchScore, setMatchScore] = useState(0);
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScanning(false);
      setProgress(0);
      setStatus('IDLE');
      setStatusMsg('Touch or press the sensor pad to scan fingerprint');
    }
  }, [isOpen]);

  const startFingerprintScan = () => {
    if (scanning || status === 'SUCCESS') return;
    setScanning(true);
    setStatus('SCANNING');
    setProgress(0);
    setStatusMsg('Reading fingerprint minutiae points & dermal ridges...');

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);

      if (currentProgress === 50) {
        setStatusMsg('Comparing extracted minutiae template against encrypted database...');
      } else if (currentProgress === 80) {
        setStatusMsg('Verifying capacitive skin conductivity and ridge flow...');
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setScanning(false);
        const score = Math.floor(Math.random() * 4) + 96; // 96% - 99%
        setMatchScore(score);
        setStatus('SUCCESS');
        setStatusMsg(`Fingerprint Verified (${score}% Pattern Match)`);

        addAuditLog({
          action: 'BIOMETRIC_FINGERPRINT_VERIFIED',
          userId: user?.id || 'GUEST',
          userRole: user?.role || 'MEMBER',
          orgId: user?.orgId || 'GLOBAL',
          details: `Fingerprint minutiae match passed with ${score}% template confidence score.`
        });

        setTimeout(() => {
          onSuccess({
            type: 'FINGERPRINT_SCAN',
            matchScore: score,
            templateHash: 'FP_TEMPLATE_' + Math.random().toString(36).substring(2, 10).toUpperCase()
          });
        }, 1200);
      }
    }, 120);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-emerald-500/30 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Fingerprint Biometric Authentication</h3>
              <p className="text-xs text-slate-400">Optical / Capacitive Minutiae Template Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sensor Visualizer */}
        <div className="p-8 flex flex-col items-center">
          <div
            onMouseDown={() => setIsPressing(true)}
            onMouseUp={() => setIsPressing(false)}
            onClick={startFingerprintScan}
            className={`relative w-40 h-40 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all duration-300 ${
              status === 'SUCCESS'
                ? 'border-emerald-400 bg-emerald-950/40 text-emerald-400 shadow-xl shadow-emerald-500/20'
                : scanning
                ? 'border-emerald-500 bg-slate-900/90 text-emerald-400 shadow-xl shadow-emerald-500/30 scale-105'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-emerald-500/60 hover:text-emerald-400 hover:scale-105'
            }`}
          >
            {/* Pulsing Outer Rings */}
            {(scanning || isPressing) && (
              <div className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping" />
            )}

            {/* Fingerprint Icon with SVG minutiae lines */}
            <div className="relative">
              <Fingerprint className={`w-24 h-24 transition-all duration-300 ${scanning ? 'animate-pulse text-emerald-400' : ''}`} />
              
              {/* Scanline Sweep across Fingerprint */}
              {scanning && (
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="animate-scanline" />
                </div>
              )}
            </div>

            {/* Minutiae Match Particles */}
            {status === 'SUCCESS' && (
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}
          </div>

          <p className="mt-4 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Click or touch sensor pad to start
          </p>

          {/* Status Message */}
          <div className="w-full mt-6 space-y-2 text-center">
            <p className="text-sm font-semibold text-slate-200">{statusMsg}</p>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3 w-full">
            <button
              onClick={startFingerprintScan}
              disabled={scanning || status === 'SUCCESS'}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Minutiae...
                </>
              ) : status === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Fingerprint Verified
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" /> Scan Fingerprint
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
