import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Smartphone, Trash2, Plus, Laptop, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiGetPasskeys, apiRevokePasskey, apiGetDevices, apiRevokeAllDevices } from '../../services/api.js';
import { checkPasskeySupport, registerNewPasskey } from '../../services/passkeyClient.js';

export default function PasskeyManager({ user }) {
  const [passkeys, setPasskeys] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [supportInfo, setSupportInfo] = useState({ supported: true, message: '' });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [pkRes, devRes, suppRes] = await Promise.all([
        apiGetPasskeys(),
        apiGetDevices(),
        checkPasskeySupport()
      ]);
      setPasskeys(pkRes.passkeys || []);
      setDevices(devRes.devices || []);
      setSupportInfo(suppRes);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load passkeys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPasskey = async () => {
    setRegistering(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const deviceName = prompt('Enter a name for this device/passkey (e.g. MacBook Pro, Windows Hello PC):', 'My Personal Device');
      if (!deviceName) {
        setRegistering(false);
        return;
      }

      await registerNewPasskey(deviceName);
      setStatusMsg('Passkey registered successfully! You can now sign in using device biometrics.');
      await fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Passkey registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const handleRevokePasskey = async (id, name) => {
    if (!confirm(`Are you sure you want to revoke passkey credential "${name}"?`)) return;
    try {
      await apiRevokePasskey(id);
      setStatusMsg(`Passkey "${name}" revoked.`);
      await fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to revoke passkey.');
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to revoke all active device sessions? You will be logged out on other devices.')) return;
    try {
      await apiRevokeAllDevices();
      setStatusMsg('All active device sessions have been revoked.');
      await fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to revoke sessions.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Security & Registered Passkeys</h2>
            <p className="text-xs text-slate-400">Manage device biometrics, Windows Hello, Touch ID / Face ID credentials.</p>
          </div>
        </div>

        <button
          onClick={handleAddPasskey}
          disabled={registering}
          className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {registering ? 'Waiting for Device...' : 'Register New Passkey'}
        </button>
      </div>

      {/* Status & Error Alerts */}
      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Support Status */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
        <div>
          <p className="font-semibold text-white">FIDO2 / WebAuthn Cryptographic Protocol Status</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{supportInfo.message}</p>
        </div>
      </div>

      {/* Passkeys List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" /> Active Passkeys ({passkeys.length})
          </h3>
          <span className="text-[11px] text-slate-400">Cryptographically Encrypted on Server</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading passkeys...</div>
        ) : passkeys.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Key className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">No passkeys registered yet.</p>
            <p className="text-[11px] text-slate-500">Register your device fingerprint or Face ID to sign in without passwords.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {passkeys.map((pk) => (
              <div key={pk.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{pk.device_name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {pk.platform || 'Platform Authenticator'} • Created {new Date(pk.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> Last used: {pk.last_used_at ? new Date(pk.last_used_at).toLocaleString() : 'Never'}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">Counter: {pk.counter}</span>
                  </div>

                  <button
                    onClick={() => handleRevokePasskey(pk.id, pk.device_name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Revoke Passkey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Device Sessions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">Active Device Sessions</h3>
            <p className="text-xs text-slate-400">Revoke sessions if you suspect unauthorized access.</p>
          </div>

          <button
            onClick={handleRevokeAll}
            className="py-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all"
          >
            Revoke All Other Sessions
          </button>
        </div>

        <div className="text-xs text-slate-400 p-3 rounded-xl bg-slate-950 border border-slate-800">
          Current Active Device: <span className="text-cyan-400 font-mono">{navigator.userAgent.substring(0, 60)}...</span>
        </div>
      </div>
    </div>
  );
}
