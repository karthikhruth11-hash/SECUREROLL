import React, { useState } from 'react';
import { 
  Users, Building2, Calendar, FileCheck, Download, ShieldCheck, 
  Search, CheckCircle2, XCircle, Clock, AlertTriangle, Eye, EyeOff, 
  Key, Camera, RefreshCw, FileText, Check, X, FileSpreadsheet, Lock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

import { 
  getUsers, getAttendanceRecords, getLeaveRequests, getOrganizations, 
  updateUserVerification, updateLeaveStatus 
} from '../../services/mockDataService';

import { getAuditLogs, decryptSensitiveData } from '../../services/securityService';
import AttendanceScannerKiosk from '../Attendance/AttendanceScannerKiosk';

export default function AdminDashboard({ user }) {
  const orgs = getOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState(user.orgId || orgs[0]?.id);
  const [activeTab, setActiveTab] = useState('MEMBERS'); // MEMBERS, ATTENDANCE, LEAVES, AUDIT_LOGS, REPORTS
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedAadharId, setRevealedAadharId] = useState(null);
  const [decryptedValue, setDecryptedValue] = useState('');
  const [showKioskModal, setShowKioskModal] = useState(false);

  // Data
  const [usersList, setUsersList] = useState(getUsers());
  const [attendanceList, setAttendanceList] = useState(getAttendanceRecords());
  const [leaveList, setLeaveList] = useState(getLeaveRequests());
  const auditLogs = getAuditLogs();

  const currentOrg = orgs.find(o => o.id === selectedOrgId) || orgs[0];

  // Filtered by selected Organization
  const orgUsers = usersList.filter(u => u.orgId === selectedOrgId && (
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const orgAttendance = attendanceList.filter(a => a.orgId === selectedOrgId && (
    a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const orgLeaves = leaveList.filter(l => l.orgId === selectedOrgId);

  // Toggle Verification for Member
  const handleToggleVerifyUser = async (userId, currentStatus) => {
    const newVerified = !currentStatus;
    const updated = await updateUserVerification(userId, {
      biometricsEnrolled: newVerified,
      idCardVerified: newVerified,
      verificationStatus: newVerified ? 'VERIFIED' : 'PENDING_VERIFICATION'
    });
    if (updated) {
      setUsersList(getUsers());
    }
  };

  // Handle Leave Decisions
  const handleLeaveDecision = async (leaveId, decision) => {
    await updateLeaveStatus(leaveId, decision, user.id);
    setLeaveList(getLeaveRequests());
  };

  // Reveal Decrypted Aadhar ID for Admin
  const handleRevealAadhar = async (member) => {
    if (revealedAadharId === member.id) {
      setRevealedAadharId(null);
      setDecryptedValue('');
      return;
    }

    const decrypted = await decryptSensitiveData(member.aadharEncrypted);
    setRevealedAadharId(member.id);
    setDecryptedValue(decrypted);
  };

  // EXPORT TO EXCEL
  const exportToExcel = () => {
    const dataToExport = orgAttendance.map(a => ({
      'Record ID': a.id,
      'Member Name': a.userName,
      'Roll / Emp ID': a.rollNumber,
      'Date': a.date,
      'Time': a.time,
      'Status': a.status,
      'Scan Method': a.method,
      'GPS Verified': a.gpsVerified ? 'YES' : 'NO',
      'Terminal Location': a.location
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    XLSX.writeFile(workbook, `SecureRoll_Attendance_${currentOrg.code}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // EXPORT TO PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`SecureRoll - ${currentOrg.name}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Attendance Report | Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Records: ${orgAttendance.length}`, 14, 34);

    let y = 45;
    doc.setFontSize(10);
    doc.text('Roll No', 14, y);
    doc.text('Name', 50, y);
    doc.text('Date & Time', 100, y);
    doc.text('Status', 160, y);
    y += 4;
    doc.line(14, y, 195, y);
    y += 6;

    orgAttendance.slice(0, 25).forEach(att => {
      doc.text(att.rollNumber, 14, y);
      doc.text(att.userName.substring(0, 20), 50, y);
      doc.text(`${att.date} ${att.time}`, 100, y);
      doc.text(att.status, 160, y);
      y += 8;
    });

    doc.save(`SecureRoll_Attendance_${currentOrg.code}.pdf`);
  };

  return (
    <div className="space-y-8">
      
      {/* Top Header & Org Switcher */}
      <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl">
            {currentOrg.logo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{currentOrg.name}</h1>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                {currentOrg.type}
              </span>
            </div>
            <p className="text-xs text-slate-400">Authorized Admin Panel • Role: <span className="text-cyan-400 font-bold">{user.role}</span></p>
          </div>
        </div>

        {/* Organization Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-cyan-400" /> Switch Org:
          </label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
          >
            {orgs.map(o => (
              <option key={o.id} value={o.id}>
                {o.logo} {o.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowKioskModal(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2"
          >
            <Camera className="w-4 h-4" /> Kiosk Scanner Mode
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'MEMBERS' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4" /> Members Registry ({orgUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'ATTENDANCE' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          <Calendar className="w-4 h-4" /> Attendance Log ({orgAttendance.length})
        </button>

        <button
          onClick={() => setActiveTab('LEAVES')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'LEAVES' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          <FileCheck className="w-4 h-4" /> Leave Desk ({orgLeaves.filter(l => l.status === 'PENDING').length} Pending)
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'AUDIT_LOGS' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          <Lock className="w-4 h-4" /> Audit Trail ({auditLogs.length})
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter members by name, roll number, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* TAB 1: MEMBERS REGISTRY */}
      {activeTab === 'MEMBERS' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 bg-slate-900/80 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Member Name</th>
                  <th className="p-4">Roll / Emp ID</th>
                  <th className="p-4">Encrypted Aadhar ID</th>
                  <th className="p-4">Biometrics Status</th>
                  <th className="p-4">ID Card Check</th>
                  <th className="p-4">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {orgUsers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-white text-sm">{member.name}</p>
                        <p className="text-[11px] text-slate-400">{member.email}</p>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-cyan-400">
                      {member.rollNumber}
                    </td>

                    {/* Decryptable Aadhar Column */}
                    <td className="p-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {revealedAadharId === member.id ? decryptedValue : member.aadharMasked}
                        </span>
                        <button
                          onClick={() => handleRevealAadhar(member)}
                          className="p-1 rounded text-slate-400 hover:text-cyan-400"
                          title="Decrypt AES-256 Aadhar (Admin Device Only)"
                        >
                          {revealedAadharId === member.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${member.biometricsEnrolled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                        {member.biometricsEnrolled ? '✓ Face & Fingerprint' : 'Pending Scan'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${member.idCardVerified ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {member.idCardVerified ? '✓ Card Matched' : 'Not Verified'}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleVerifyUser(member.id, member.biometricsEnrolled)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${member.biometricsEnrolled ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'}`}
                      >
                        {member.biometricsEnrolled ? 'Revoke Access' : 'Approve & Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE LOG */}
      {activeTab === 'ATTENDANCE' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 bg-slate-900/80 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Member Name</th>
                  <th className="p-4">Roll / Emp ID</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Scan Method</th>
                  <th className="p-4">GPS Premise Check</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {orgAttendance.map(att => (
                  <tr key={att.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-bold text-white">{att.userName}</td>
                    <td className="p-4 text-cyan-400">{att.rollNumber}</td>
                    <td className="p-4 text-slate-400">{att.date} {att.time}</td>
                    <td className="p-4">{att.method}</td>
                    <td className="p-4">
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Validated ({att.location.substring(0, 18)}...)
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${att.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : att.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE DESK */}
      {activeTab === 'LEAVES' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Pending Leave Requests Review</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgLeaves.map(leave => (
              <div key={leave.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">{leave.userName}</h4>
                    <p className="text-xs text-cyan-400 font-mono">Roll: {leave.rollNumber}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${leave.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : leave.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {leave.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p><span className="text-slate-400">Type:</span> <span className="font-bold text-white">{leave.type}</span></p>
                  <p><span className="text-slate-400">Dates:</span> <span className="font-mono text-cyan-300">{leave.startDate} to {leave.endDate}</span></p>
                  <p><span className="text-slate-400">Reason:</span> {leave.reason}</p>
                </div>

                {leave.status === 'PENDING' && (
                  <div className="pt-3 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={() => handleLeaveDecision(leave.id, 'APPROVED')}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" /> Approve Leave
                    </button>
                    <button
                      onClick={() => handleLeaveDecision(leave.id, 'REJECTED')}
                      className="flex-1 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" /> Reject Leave
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-400 bg-slate-900/80 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Event Action</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Audit Details</th>
                  <th className="p-3">Checksum Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="p-3 text-cyan-400 font-bold">{log.id}</td>
                    <td className="p-3 text-slate-400">{log.timestamp.substring(0, 19).replace('T', ' ')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-300'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-white">{log.userId} ({log.userRole})</td>
                    <td className="p-3 text-slate-400 truncate max-w-sm">{log.details}</td>
                    <td className="p-3 text-emerald-400">{log.checksum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Kiosk Modal */}
      <AttendanceScannerKiosk
        isOpen={showKioskModal}
        onClose={() => setShowKioskModal(false)}
        orgId={selectedOrgId}
        onScanComplete={() => setAttendanceList(getAttendanceRecords())}
      />

    </div>
  );
}
