import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, FileText, Upload, RefreshCw, X, Award } from 'lucide-react';
import { addAuditLog } from '../../services/securityService';

export default function OrgIDVerificationModal({ isOpen, onClose, onSuccess, user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState('IDLE'); // IDLE, VERIFYING, SUCCESS, FAILED
  const [ocrData, setOcrData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStatus('IDLE');
      setErrorMsg('');
    }
  };

  const simulateCameraCapture = () => {
    // Generate simulated Org ID card preview
    setPreviewUrl('SIMULATED_CARD');
    setSelectedFile({ name: 'Org_ID_Card_Scan.jpg' });
    setStatus('IDLE');
    setErrorMsg('');
  };

  const runIDVerification = () => {
    if (!previewUrl || verifying) return;
    setVerifying(true);
    setStatus('VERIFYING');

    setTimeout(() => {
      setVerifying(false);
      setStatus('SUCCESS');
      const mockOcr = {
        orgName: user?.orgName || 'St. Xavier Institute of Technology',
        rollNumber: user?.rollNumber || '2024-CS-108',
        issueDate: '2024-08-01',
        validUntil: '2028-07-31',
        authenticityConfidence: '99.4%'
      };
      setOcrData(mockOcr);

      addAuditLog({
        action: 'ORG_ID_CARD_VERIFIED',
        userId: user?.id || 'GUEST',
        userRole: user?.role || 'MEMBER',
        orgId: user?.orgId || 'GLOBAL',
        details: `Organization ID card OCR check matched Roll/Emp #${mockOcr.rollNumber} with ${mockOcr.authenticityConfidence} authenticity confidence.`
      });

      setTimeout(() => {
        onSuccess({
          type: 'ORG_ID_CARD',
          ocrData: mockOcr
        });
      }, 1200);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-blue-500/30 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Organization ID Card Verification</h3>
              <p className="text-xs text-slate-400">Second-Layer Identity Authenticity Validation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Card Preview Box */}
          <div className="relative aspect-[1.6/1] w-full max-w-md mx-auto rounded-2xl bg-slate-900/90 border-2 border-dashed border-blue-500/40 overflow-hidden flex flex-col items-center justify-center">
            {previewUrl ? (
              previewUrl === 'SIMULATED_CARD' ? (
                <div className="w-full h-full p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-between border border-blue-500/30 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Award className="w-8 h-8 text-blue-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{user?.orgName || 'St. Xavier Institute of Tech'}</h4>
                        <p className="text-[10px] text-blue-400 tracking-widest font-mono">OFFICIAL MEMBER ID PASS</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-500/30">VERIFIED</span>
                  </div>

                  <div className="flex items-center gap-4 my-2">
                    <div className="w-16 h-16 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 font-bold text-xl">
                      {user?.name ? user.name[0] : 'U'}
                    </div>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs text-slate-400">Holder Name</p>
                      <p className="text-sm font-bold text-white">{user?.name || 'Rohit Sharma'}</p>
                      <p className="text-xs font-mono text-cyan-400">Roll/Emp: {user?.rollNumber || '2024-CS-108'}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-700/60 pt-2 font-mono">
                    <span>Issued: 2024-08-01</span>
                    <span>Status: AUTHENTICATED</span>
                  </div>
                </div>
              ) : (
                <img src={previewUrl} alt="ID Card Scan" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Upload or Capture Organization ID</p>
                  <p className="text-xs text-slate-400 mt-1">Supports Student ID Card, Employee Badge, or Faculty Pass</p>
                </div>
              </div>
            )}

            {/* Scan Overlay */}
            {verifying && <div className="animate-scanline" />}
          </div>

          {/* Upload & Capture Buttons */}
          <div className="flex justify-center items-center gap-3">
            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors">
              <Upload className="w-4 h-4 text-blue-400" /> Upload ID Photo
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>

            <button
              onClick={simulateCameraCapture}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-cyan-400" /> Instant ID Card Scan
            </button>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
            <button
              onClick={runIDVerification}
              disabled={!previewUrl || verifying || status === 'SUCCESS'}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying ID Authenticity...
                </>
              ) : status === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ID Verified
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Validate Organization ID
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
