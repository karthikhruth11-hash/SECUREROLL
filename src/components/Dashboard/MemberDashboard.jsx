import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, QrCode, FileText, Plus, ShieldCheck, AlertCircle, Sparkles, Send } from 'lucide-react';
import { getAttendanceRecords, getLeaveRequests, submitLeaveRequest } from '../../services/mockDataService';
import MemberBarcodeCard from '../Attendance/MemberBarcodeCard';
import FaceScanModal from '../Biometrics/FaceScanModal';
import FingerprintScanModal from '../Biometrics/FingerprintScanModal';
import OrgIDVerificationModal from '../Biometrics/OrgIDVerificationModal';

export default function MemberDashboard({ user, onUpdateUser }) {
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showFpModal, setShowFpModal] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);

  // Leave Form State
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [startDate, setStartDate] = useState('2026-08-18');
  const [endDate, setEndDate] = useState('2026-08-19');
  const [reason, setReason] = useState('');
  const [leaveMsg, setLeaveMsg] = useState('');

  // Load User Specific Attendance Records
  const allAttendance = getAttendanceRecords();
  const userAttendance = allAttendance.filter(a => a.userId === user.id || a.rollNumber === user.rollNumber);

  // Stats calculation
  const totalDays = 22; // Month standard
  const presentCount = userAttendance.filter(a => a.status === 'PRESENT').length + 15; // Seeded base
  const lateCount = userAttendance.filter(a => a.status === 'LATE').length + 2;
  const absentCount = totalDays - presentCount - lateCount;
  const attendancePct = Math.round(((presentCount + lateCount) / totalDays) * 100);

  // Load User Specific Leaves
  const allLeaves = getLeaveRequests();
  const userLeaves = allLeaves.filter(l => l.userId === user.id || l.rollNumber === user.rollNumber);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setLeaveMsg('');
    if (!startDate || !endDate || !reason) {
      setLeaveMsg('Please fill in all leave details.');
      return;
    }

    await submitLeaveRequest({
      userId: user.id,
      userName: user.name,
      rollNumber: user.rollNumber,
      orgId: user.orgId,
      startDate,
      endDate,
      type: leaveType,
      reason
    });

    setLeaveMsg('Leave application submitted successfully. Pending Admin review.');
    setReason('');
    setShowLeaveForm(false);
  };

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-8 border border-cyan-500/30 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-mono">
              {user.orgName}
            </span>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-mono">
              Roll: {user.rollNumber}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Welcome back, {user.name}</h1>
          <p className="text-xs text-slate-400">
            Aadhar Status: <span className="text-emerald-400 font-mono font-semibold">{user.aadharMasked || 'VERIFIED'}</span> • Encrypted Storage Active
          </p>
        </div>

        <button
          onClick={() => setShowBarcodeModal(true)}
          className="py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center gap-3 transition-all transform hover:-translate-y-0.5"
        >
          <QrCode className="w-6 h-6" /> Display Attendance Barcode / QR Pass
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Attendance Percentage */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance %</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-white">{attendancePct}%</span>
            <span className="text-xs font-mono text-emerald-400">Good Standing</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${attendancePct}%` }} />
          </div>
        </div>

        {/* Days Present */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Present Days</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-4xl font-extrabold text-white">{presentCount} Days</span>
          <p className="text-[11px] text-slate-400">Out of {totalDays} total working days</p>
        </div>

        {/* Late Entries */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Late Entries</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-4xl font-extrabold text-white">{lateCount}</span>
          <p className="text-[11px] text-slate-400">Recorded post 09:15 AM</p>
        </div>

        {/* Absent Days */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Absent Days</span>
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>
          <span className="text-4xl font-extrabold text-white">{absentCount} Days</span>
          <p className="text-[11px] text-slate-400">Includes leaves taken</p>
        </div>

      </div>

      {/* Biometric Status & Leave Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Biometric Enrolment Cards */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 lg:col-span-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" /> Biometric Identity Status
          </h3>

          <div className="space-y-3">
            
            {/* Face Status */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Facial Recognition</p>
                <p className="text-[10px] text-slate-400">Anti-spoof Liveness Check</p>
              </div>
              <button
                onClick={() => setShowFaceModal(true)}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
              >
                ✓ Enrolled
              </button>
            </div>

            {/* Fingerprint Status */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Fingerprint Scan</p>
                <p className="text-[10px] text-slate-400">Minutiae Pattern Template</p>
              </div>
              <button
                onClick={() => setShowFpModal(true)}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
              >
                ✓ Enrolled
              </button>
            </div>

            {/* Org ID Status */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Organization ID Card</p>
                <p className="text-[10px] text-slate-400">2nd Layer OCR Validation</p>
              </div>
              <button
                onClick={() => setShowIdModal(true)}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
              >
                ✓ Verified
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Attendance Records & Leave Desk */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6 lg:col-span-2">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-cyan-400" /> Recent Attendance Scans
            </h3>
            <button
              onClick={() => setShowLeaveForm(!showLeaveForm)}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </button>
          </div>

          {/* Apply Leave Form */}
          {showLeaveForm && (
            <form onSubmit={handleApplyLeave} className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-4 animate-in fade-in">
              <h4 className="text-sm font-bold text-white">Apply for Leave Request</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300 font-semibold">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Paid Leave">Paid Leave</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300 font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300 font-semibold">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold">Reason for Leave</label>
                <textarea
                  rows="2"
                  placeholder="State your reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </form>
          )}

          {leaveMsg && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs">
              {leaveMsg}
            </div>
          )}

          {/* Attendance Log Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 bg-slate-900/60 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Verification Method</th>
                  <th className="p-3">Location / Terminal</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {userAttendance.length > 0 ? (
                  userAttendance.map(att => (
                    <tr key={att.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 text-white font-semibold">{att.date}</td>
                      <td className="p-3 text-slate-400">{att.time}</td>
                      <td className="p-3">{att.method}</td>
                      <td className="p-3 text-slate-400">{att.location}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${att.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : att.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-500 italic">
                      No attendance scans recorded today yet. Use your Digital Barcode Pass above to scan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Leave Requests Table */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Leave Applications Status</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 bg-slate-900/60 uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Duration</th>
                    <th className="p-2.5">Reason</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {userLeaves.map(lv => (
                    <tr key={lv.id}>
                      <td className="p-2.5 font-bold text-white">{lv.type}</td>
                      <td className="p-2.5 font-mono text-slate-400">{lv.startDate} to {lv.endDate}</td>
                      <td className="p-2.5 text-slate-400 truncate max-w-xs">{lv.reason}</td>
                      <td className="p-2.5 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lv.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : lv.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {lv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Barcode Pass Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative">
            <button
              onClick={() => setShowBarcodeModal(false)}
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 shadow-lg"
            >
              ✕
            </button>
            <MemberBarcodeCard user={user} onAttendanceMarked={() => setShowBarcodeModal(false)} />
          </div>
        </div>
      )}

      {/* Biometric Enrolment Modals */}
      <FaceScanModal
        isOpen={showFaceModal}
        onClose={() => setShowFaceModal(false)}
        user={user}
        onSuccess={() => setShowFaceModal(false)}
      />

      <FingerprintScanModal
        isOpen={showFpModal}
        onClose={() => setShowFpModal(false)}
        user={user}
        onSuccess={() => setShowFpModal(false)}
      />

      <OrgIDVerificationModal
        isOpen={showIdModal}
        onClose={() => setShowIdModal(false)}
        user={user}
        onSuccess={() => setShowIdModal(false)}
      />

    </div>
  );
}
