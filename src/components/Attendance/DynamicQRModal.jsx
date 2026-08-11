import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, RefreshCw, X, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { apiGetSessionToken } from '../../services/api.js';

export default function DynamicQRModal({ isOpen, onClose, session }) {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15);

  const fetchToken = async () => {
    if (!session?.id) return;
    try {
      const res = await apiGetSessionToken(session.id);
      setTokenInfo(res.token);
      setSecondsRemaining(res.expiresInSeconds || 15);
    } catch (err) {
      console.error('Failed to fetch dynamic QR token:', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !session?.id) return;
    fetchToken();

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          fetchToken();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, session?.id]);

  if (!isOpen || !session) return null;

  const qrPayload = JSON.stringify({
    sessionId: session.id,
    token: tokenInfo,
    timestamp: Date.now()
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-white">Dynamic Attendance QR</h3>
              <p className="text-xs text-slate-400">{session.subject_name || 'Course Class'} ({session.section})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-6 rounded-2xl bg-white flex flex-col items-center justify-center border-4 border-cyan-400 shadow-lg relative mx-auto w-64 h-64">
          {tokenInfo ? (
            <QRCodeSVG value={qrPayload} size={210} level="H" includeMargin={true} />
          ) : (
            <div className="text-slate-950 font-mono text-xs animate-pulse">Generating Dynamic Security Token...</div>
          )}
        </div>

        {/* Rotation Countdown */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Token Refresh Window
            </span>
            <span className="text-cyan-400 font-bold">{secondsRemaining}s</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-cyan-400 transition-all duration-1000"
              style={{ width: `${(secondsRemaining / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Security Warning */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Short-Lived 15s Server Token. Screenshots cannot be saved or reused.</span>
        </div>
      </div>
    </div>
  );
}
