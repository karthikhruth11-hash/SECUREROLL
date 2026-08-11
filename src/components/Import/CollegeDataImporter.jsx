import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { apiImportCollegeData } from '../../services/api.js';

export default function CollegeDataImporter({ onComplete }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/);
        if (lines.length < 2) {
          throw new Error('CSV file is empty or missing header row.');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || '';
          });
          rows.push(rowObj);
        }

        setParsedRows(rows);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiImportCollegeData(parsedRows);
      setResult(res);
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Import execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">College Data Import Center</h2>
            <p className="text-xs text-slate-400">Import student, faculty, and section rosters via CSV / Excel format.</p>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="p-8 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 text-center space-y-4">
        <Upload className="w-10 h-10 text-cyan-400 mx-auto" />
        <div>
          <p className="text-sm font-bold text-white">Select CSV / Excel Roster File</p>
          <p className="text-xs text-slate-400 mt-1">Expected columns: College ID, Name, Email, Role, Department, Section</p>
        </div>

        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
          id="college-csv-input"
        />

        <label
          htmlFor="college-csv-input"
          className="inline-block py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold cursor-pointer transition-colors"
        >
          Choose File
        </label>

        {file && <p className="text-xs font-mono text-cyan-400">Selected: {file.name} ({parsedRows.length} rows parsed)</p>}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Alert */}
      {result && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Import Execution Complete
          </div>
          <p>{result.message}</p>
          {result.errors && result.errors.length > 0 && (
            <div className="pt-2 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-400/80 space-y-1">
              <p className="font-bold">Skipped Row Warnings:</p>
              {result.errors.map((e, idx) => <p key={idx}>• {e}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Preview Table & Confirm Button */}
      {parsedRows.length > 0 && !result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-4">
          <div className="p-4 px-6 bg-slate-950 flex justify-between items-center text-xs">
            <span className="font-bold text-white">Parsed Roster Preview ({parsedRows.length} Records)</span>
            <button
              onClick={handleExecuteImport}
              disabled={loading}
              className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {loading ? 'Executing Import Transaction...' : 'Confirm & Execute Database Import'}
            </button>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">College ID</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {parsedRows.slice(0, 10).map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-cyan-400">{r.collegeId || r['College ID'] || r['Roll No']}</td>
                    <td className="py-2 px-4 text-white font-sans">{r.name || r['Name']}</td>
                    <td className="py-2 px-4 text-slate-300">{r.email || r['Email']}</td>
                    <td className="py-2 px-4 text-slate-400">{r.role || 'STUDENT'}</td>
                    <td className="py-2 px-4 text-slate-400">{r.section || 'CSE-A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
