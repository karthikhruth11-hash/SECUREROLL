import React, { useState, useEffect } from 'react';
import { Users, QrCode, ShieldAlert, Sparkles, Plus, Play, FileText, Upload, Key, RefreshCw, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  apiGetActiveSessions,
  apiCreateSession,
  apiGetUsers,
  apiGetAIInsights,
  apiGetAIPredictions
} from '../../services/api.js';

export default function AdminDashboard({ user, onNavigate, onStartLiveMonitor }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [createData, setCreateData] = useState({ subjectId: 'SUB-CS301', section: 'CSE-A', durationMinutes: 60 });
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sessRes, userRes, aiRes, predRes] = await Promise.all([
        apiGetActiveSessions(),
        apiGetUsers(),
        apiGetAIInsights(),
        apiGetAIPredictions()
      ]);
      setActiveSessions(sessRes.sessions || []);
      setUsers(userRes.users || []);
      setAiInsights(aiRes.insights || []);
      setPredictions(predRes);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateSessionSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCreateSession(createData);
      setStatusMsg(`Session created for ${res.session.subjectName} (${res.session.section})!`);
      setShowCreateSessionModal(false);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to create attendance session.');
    }
  };

  const studentCount = users.filter(u => u.role === 'STUDENT').length;
  const facultyCount = users.filter(u => u.role === 'LECTURER' || u.role === 'HOD').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Role Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Welcome back, {user.name}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">SECURE Platform — Academic Identity & Security Intelligence Command</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'LECTURER') && (
            <button
              onClick={() => setShowCreateSessionModal(true)}
              className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Start Attendance Session
            </button>
          )}

          <button
            onClick={() => onNavigate('IMPORT')}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-cyan-400" /> Roster Import
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Top Statistical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" /> Total Enrolled Students
          </p>
          <p className="text-2xl font-extrabold text-white">{studentCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" /> Faculty & Staff
          </p>
          <p className="text-2xl font-extrabold text-emerald-400">{facultyCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-amber-400" /> Active Class Sessions
          </p>
          <p className="text-2xl font-extrabold text-amber-400">{activeSessions.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> At-Risk Students (&lt;75%)
          </p>
          <p className="text-2xl font-extrabold text-rose-400">{predictions?.atRiskCount || 0}</p>
        </div>
      </div>

      {/* AI Intelligence Cards Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> AI Operational & Predictive Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((ins) => (
            <div key={ins.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                  {ins.category}
                </span>
                <span className="text-lg font-extrabold text-white">{ins.value}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{ins.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{ins.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Class Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 px-6 bg-slate-950 flex justify-between items-center text-xs">
          <h3 className="font-bold text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-cyan-400" /> Live Active Classes ({activeSessions.length})
          </h3>
          <span className="text-slate-400 font-mono">15s Dynamic Tokens Active</span>
        </div>

        <div className="divide-y divide-slate-800">
          {activeSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No active class attendance sessions right now.</div>
          ) : (
            activeSessions.map((sess) => (
              <div key={sess.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-white">{sess.subject_name} ({sess.section})</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Lecturer: {sess.lecturer_name} • Started: {new Date(sess.start_time).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-400 font-bold px-2.5 py-1 bg-emerald-500/10 rounded-lg">
                    {sess.present_count} Present
                  </span>

                  <button
                    onClick={() => onStartLiveMonitor(sess.id)}
                    className="py-1.5 px-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold"
                  >
                    Open Live Monitor
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Start New Attendance Class</h3>

            <form onSubmit={handleCreateSessionSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Select Course Subject</label>
                <select
                  value={createData.subjectId}
                  onChange={(e) => setCreateData({ ...createData, subjectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                >
                  <option value="SUB-CS301">CS301 - Data Structures & Algorithms</option>
                  <option value="SUB-CS302">CS302 - Database Management Systems</option>
                  <option value="SUB-EC201">EC201 - Digital Signal Processing</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Select Section</label>
                <select
                  value={createData.section}
                  onChange={(e) => setCreateData({ ...createData, section: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                >
                  <option value="CSE-A">CSE-A</option>
                  <option value="CSE-B">CSE-B</option>
                  <option value="ECE-A">ECE-A</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Duration (Minutes)</label>
                <input
                  type="number"
                  value={createData.durationMinutes}
                  onChange={(e) => setCreateData({ ...createData, durationMinutes: parseInt(e.target.value) || 60 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Create Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateSessionModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
