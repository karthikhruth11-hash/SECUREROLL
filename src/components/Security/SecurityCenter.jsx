import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, AlertOctagon, RefreshCw, FileText, CheckCircle2, Clock, Filter } from 'lucide-react';
import { apiGetAuditLogs, apiGetSecurityEvents, apiGetSystemHealth } from '../../services/api.js';

export default function SecurityCenter() {
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('LOGS'); // LOGS, EVENTS, HEALTH
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logRes, eventRes, healthRes] = await Promise.all([
        apiGetAuditLogs(),
        apiGetSecurityEvents(),
        apiGetSystemHealth()
      ]);
      setLogs(logRes.logs || []);
      setEvents(eventRes.events || []);
      setHealth(healthRes);
    } catch (err) {
      console.error('Failed to load security center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEvents = filterSeverity === 'ALL'
    ? events
    : events.filter(e => e.severity === filterSeverity);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Security Intelligence Center</h2>
            <p className="text-xs text-slate-400">Audit trail, failed login telemetry, anomaly detection, and health status.</p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'LOGS' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-4 h-4" /> Audit Logs ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'EVENTS' ? 'border-rose-400 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <AlertOctagon className="w-4 h-4" /> Security Events ({events.length})
        </button>

        <button
          onClick={() => setActiveTab('HEALTH')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'HEALTH' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <ShieldCheck className="w-4 h-4" /> System Health
        </button>
      </div>

      {/* Audit Logs Tab */}
      {activeTab === 'LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 px-6 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Showing SHA-256 Checksum Verified Audit Records</span>
            <span>Max 200 Entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Checksum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {log.actor_name || log.actor_id} <span className="text-[10px] text-cyan-400 font-mono">({log.actor_role})</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-300">{log.action}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">{log.details || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">{log.checksum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Events Tab */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-slate-900 p-3 px-4 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter Severity:
            </span>

            <div className="flex gap-2">
              {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${filterSeverity === sev ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${evt.severity === 'HIGH' || evt.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{evt.event_type}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${evt.severity === 'HIGH' || evt.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {evt.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{evt.details}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-2">
                      <span>User: {evt.user_name || evt.user_id || 'ANONYMOUS'}</span>
                      <span>•</span>
                      <span>IP: {evt.ip_address}</span>
                      <span>•</span>
                      <span>{new Date(evt.created_at).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'HEALTH' && health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(health.services || {}).map(([key, svc]) => (
            <div key={key} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${svc.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                  {svc.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{svc.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
