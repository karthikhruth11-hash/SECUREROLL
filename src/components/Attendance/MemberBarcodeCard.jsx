import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Barcode, ShieldCheck, RefreshCw, Clock, Copy, Check, Download } from 'lucide-react';
import { markAttendanceInDatabase } from '../../services/mockDataService';

export default function MemberBarcodeCard({ user, onAttendanceMarked }) {
  const [tokenTime, setTokenTime] = useState(60); // 60 seconds countdown
  const [securityHash, setSecurityHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markResult, setMarkResult] = useState(null);

  // Generate dynamic token hash
  const generateDynamicToken = () => {
    const timeBucket = Math.floor(Date.now() / 60000);
    const hash = 'TOKEN-' + user?.rollNumber + '-' + timeBucket + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setSecurityHash(hash);
    setTokenTime(60);
  };

  useEffect(() => {
    generateDynamicToken();
    const interval = setInterval(() => {
      setTokenTime(prev => {
        if (prev <= 1) {
          generateDynamicToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Payload encoded in QR & Barcode
  const qrPayload = JSON.stringify({
    rollNumber: user?.rollNumber || '2024-CS-108',
    userId: user?.id,
    userName: user?.name,
    orgId: user?.orgId,
    token: securityHash,
    issuedAt: new Date().toISOString()
  });

  const handleSelfMark = async () => {
    if (marking) return;
    setMarking(true);
    setMarkResult(null);

    const result = await markAttendanceInDatabase({
      userId: user?.id,
      userName: user?.name,
      rollNumber: user?.rollNumber,
      orgId: user?.orgId,
      method: 'DIGITAL_BARCODE_PASS',
      gpsVerified: true,
      location: 'Member Mobile Device (Self Scan)'
    });

    setMarking(false);
    setMarkResult(result);
    if (result.success && onAttendanceMarked) {
      onAttendanceMarked(result.record);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto glass-panel rounded-3xl p-6 border border-cyan-500/30 shadow-2xl relative space-y-6 text-center">
      
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-left">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{user?.name || 'Rohit Sharma'}</h3>
            <p className="text-[11px] text-cyan-400 font-mono">Roll: {user?.rollNumber || '2024-CS-108'}</p>
          </div>
        </div>

        <span className="text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3 animate-spin" /> Refresh: {tokenTime}s
        </span>
      </div>

      {/* QR Code Container */}
      <div className="bg-white p-5 rounded-2xl inline-block shadow-xl border-4 border-slate-900 relative group">
        <QRCodeSVG
          value={qrPayload}
          size={180}
          level="H"
          includeMargin={true}
        />
        <div className="mt-2 pt-2 border-t border-slate-200 text-center">
          <p className="text-[10px] font-mono font-bold text-slate-800 tracking-wider">
            {user?.rollNumber || '2024-CS-108'}
          </p>
        </div>
      </div>

      {/* Code 128 Visual Barcode Representation */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono flex items-center justify-center gap-1">
          <Barcode className="w-4 h-4 text-cyan-400" /> Digital Attendance Barcode
        </p>
        
        {/* Simulated Code 128 Strip */}
        <div className="h-12 bg-white rounded flex items-center justify-between px-3 py-1">
          {[1,3,1,2,4,1,2,3,1,4,2,1,3,2,1,4,1,2,3,1,2,4,1,3,2,1,4,2,1,3].map((width, idx) => (
            <span
              key={idx}
              className="h-full bg-slate-950 inline-block"
              style={{ width: `${width * 2}px` }}
            />
          ))}
        </div>

        <p className="text-xs font-mono text-cyan-400 font-bold tracking-widest">
          *{user?.rollNumber || '2024-CS-108'}*
        </p>
      </div>

      {/* Security Hash info */}
      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between px-2">
        <span className="truncate">Hash: {securityHash.substring(0, 22)}...</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(securityHash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {markResult && (
        <div className={`p-3 rounded-xl text-xs font-medium ${markResult.success ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'}`}>
          {markResult.message}
        </div>
      )}

      {/* Self Mark Button */}
      <button
        onClick={handleSelfMark}
        disabled={marking}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {marking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Mark Attendance Now
      </button>

    </div>
  );
}
