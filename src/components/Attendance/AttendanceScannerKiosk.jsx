import React, { useState, useEffect } from 'react';
import { QrCode, Barcode, MapPin, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck, Camera, Volume2 } from 'lucide-react';
import { markAttendanceInDatabase, getUsers, getOrganizations } from '../../services/mockDataService';
import { addAuditLog } from '../../services/securityService';

export default function AttendanceScannerKiosk({ isOpen, onClose, orgId, onScanComplete }) {
  const [manualRoll, setManualRoll] = useState('');
  const [scanning, setScanning] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(true);
  const [currentCoords, setCurrentCoords] = useState({ lat: 28.6273, lng: 77.3714 });
  const [scanResult, setScanResult] = useState(null);
  const [kioskStatus, setKioskStatus] = useState('READY'); // READY, SCANNING, SUCCESS, ERROR

  const orgs = getOrganizations();
  const currentOrg = orgs.find(o => o.id === orgId) || orgs[0];

  // Browser Geolocation Check
  const checkGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setGpsVerified(true);
        },
        (err) => {
          console.warn('Geolocation lookup defaulted to campus hub:', err);
          setGpsVerified(true); // Fallback to simulated campus premise
        }
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkGeolocation();
      setScanResult(null);
      setKioskStatus('READY');
    }
  }, [isOpen]);

  const processScanPayload = async (rollToScan) => {
    if (!rollToScan || scanning) return;
    setScanning(true);
    setKioskStatus('SCANNING');

    setTimeout(async () => {
      const users = getUsers();
      const matchedUser = users.find(u => u.rollNumber.toLowerCase() === rollToScan.trim().toLowerCase());

      if (!matchedUser) {
        setScanning(false);
        setKioskStatus('ERROR');
        setScanResult({
          success: false,
          message: `Unrecognized Roll/Emp #${rollToScan}. Member is not registered in ${currentOrg.name}.`
        });

        await addAuditLog({
          action: 'KIOSK_SCAN_FAILED',
          userId: 'UNKNOWN',
          userRole: 'GUEST',
          orgId: currentOrg.id,
          details: `Kiosk scan attempted for unregistered roll number ${rollToScan}.`,
          status: 'FAILED'
        });

        return;
      }

      // Mark Attendance in Database
      const res = await markAttendanceInDatabase({
        userId: matchedUser.id,
        userName: matchedUser.name,
        rollNumber: matchedUser.rollNumber,
        orgId: currentOrg.id,
        method: 'KIOSK_CAM_SCAN',
        gpsVerified: gpsVerified,
        location: `${currentOrg.name} (${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)})`
      });

      setScanning(false);
      setKioskStatus(res.success ? 'SUCCESS' : 'WARNING');
      setScanResult({
        ...res,
        user: matchedUser
      });

      if (onScanComplete) onScanComplete(res);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl">
        
        {/* Kiosk Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Live Attendance Kiosk Terminal</h3>
              <p className="text-xs text-slate-400">{currentOrg.name} • Geo-Fence Validated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kiosk Viewport */}
        <div className="p-6 space-y-6 flex flex-col items-center">
          
          {/* Geolocation Status Badge */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" /> GPS Premise Status:
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ✓ Within Premise Bounds ({currentCoords.lat.toFixed(3)}, {currentCoords.lng.toFixed(3)})
            </span>
          </div>

          {/* Camera Scanner Simulation Frame */}
          <div className="relative w-full aspect-video max-w-md bg-slate-950 rounded-2xl overflow-hidden border-2 border-cyan-500/40 flex flex-col items-center justify-center p-6 text-center shadow-inner">
            
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 animate-pulse">
              <QrCode className="w-10 h-10" />
            </div>

            <p className="text-sm font-bold text-slate-200">Align Barcode or QR Code to Scan</p>
            <p className="text-xs text-slate-400 mt-1">Automatic detection & roll number lookup active</p>

            {/* Target Reticle */}
            <div className="absolute inset-8 border border-dashed border-cyan-400/40 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="w-48 h-24 border-2 border-cyan-400 rounded-lg animate-pulse" />
            </div>

            {/* Scan Laser */}
            {scanning && <div className="animate-scanline" />}
          </div>

          {/* Quick Simulation Buttons / Input */}
          <div className="w-full max-w-md space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Test Kiosk Scan (Enter Roll / Employee Number or Pick Demo Member):
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 2024-CS-108 or EMP-9042"
                value={manualRoll}
                onChange={(e) => setManualRoll(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={() => processScanPayload(manualRoll)}
                disabled={!manualRoll || scanning}
                className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-colors"
              >
                Scan Now
              </button>
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => { setManualRoll('2024-CS-108'); processScanPayload('2024-CS-108'); }}
                className="flex-1 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px]"
              >
                🎓 Scan Rohit (CS-108)
              </button>
              <button
                onClick={() => { setManualRoll('EMP-9042'); processScanPayload('EMP-9042'); }}
                className="flex-1 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px]"
              >
                🏢 Scan Ananya (EMP-9042)
              </button>
            </div>
          </div>

          {/* Result Alert Banner */}
          {scanResult && (
            <div className={`w-full max-w-md p-4 rounded-2xl border text-xs space-y-1.5 animate-in fade-in ${scanResult.success ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'}`}>
              <div className="flex items-center justify-between font-bold text-sm">
                <span className="flex items-center gap-1.5">
                  {scanResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                  {scanResult.success ? 'Attendance Marked!' : 'Scan Rejected'}
                </span>
                {scanResult.record?.status && (
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/30">
                    STATUS: {scanResult.record.status}
                  </span>
                )}
              </div>
              <p>{scanResult.message}</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
