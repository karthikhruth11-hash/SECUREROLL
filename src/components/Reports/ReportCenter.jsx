import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, RefreshCw, Printer, Calendar, Database } from 'lucide-react';
import { apiGetReportsSummary, apiGetDepartments } from '../../services/api.js';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function ReportCenter() {
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [repRes, deptRes] = await Promise.all([
        apiGetReportsSummary({ departmentId: selectedDept, section: selectedSection }),
        apiGetDepartments()
      ]);
      setReports(repRes.records || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Failed to load report summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedDept, selectedSection]);

  const exportExcel = () => {
    const wsData = reports.map(r => ({
      'Student Name': r.student_name,
      'College ID': r.college_id,
      'Department': r.department_name,
      'Section': r.section,
      'Subject': r.subject_name,
      'Status': r.status,
      'Verification Method': r.verification_method,
      'Timestamp': new Date(r.timestamp).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    XLSX.writeFile(wb, `SECURE_Attendance_Report_${Date.now()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('SECURE Platform — Official Attendance Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Records Verified: ${reports.length}`, 14, 34);

    let y = 46;
    doc.setFontSize(9);
    doc.text('Student Name | College ID | Subject | Method | Timestamp', 14, y);
    y += 6;

    reports.slice(0, 30).forEach(r => {
      doc.text(`${r.student_name} | ${r.college_id} | ${r.subject_code} | ${r.verification_method} | ${new Date(r.timestamp).toLocaleDateString()}`, 14, y);
      y += 6;
    });

    doc.save(`SECURE_Attendance_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Attendance & Security Report Center</h2>
            <p className="text-xs text-slate-400">Generate, filter, and export official institution attendance records.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportExcel}
            className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" /> Export Excel (.xlsx)
          </button>

          <button
            onClick={exportPDF}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-cyan-400" /> Filters:
        </span>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Sections</option>
          <option value="CSE-A">CSE-A</option>
          <option value="CSE-B">CSE-B</option>
          <option value="ECE-A">ECE-A</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 px-6 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Showing Verified Attendance Transactions ({reports.length})</span>
          <span>Audit Logged Export Stream</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">College ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading reports...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">No attendance records match the selected filter criteria.</td></tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-bold">{r.student_name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{r.college_id}</td>
                    <td className="py-3 px-4 text-slate-300">{r.department_name}</td>
                    <td className="py-3 px-4 text-slate-300">{r.section}</td>
                    <td className="py-3 px-4 text-cyan-300">{r.subject_code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-mono text-[11px]">{r.verification_method}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{new Date(r.timestamp).toLocaleString()}</td>
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
