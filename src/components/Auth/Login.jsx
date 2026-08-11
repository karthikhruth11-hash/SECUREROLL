import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, Key, Smartphone, ArrowRight, AlertTriangle, CheckCircle2, Clock, UserPlus, Laptop } from 'lucide-react';
import { apiLogin, apiRequestOTP, apiVerifyOTP, apiGetSMSStatus } from '../../services/api.js';
import { checkPasskeySupport, authenticateWithPasskey } from '../../services/passkeyClient.js';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [authMode, setAuthMode] = useState('PASSWORD'); // PASSWORD, PASSKEY, OTP
  const [emailOrCollegeId, setEmailOrCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [smsStatus, setSmsStatus] = useState({ configured: true, message: '' });
  const [passkeySupport, setPasskeySupport] = useState({ supported: true, message: '' });
  const [isOwnerPC, setIsOwnerPC] = useState(false);

  useEffect(() => {
    const checkOwner = () => {
      const isLocal = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        localStorage.getItem('secure_owner_pc_device') === 'true'
      );
      setIsOwnerPC(isLocal);
    };

    const checkStatus = async () => {
      try {
        const [smsRes, pkRes] = await Promise.all([
          apiGetSMSStatus(),
          checkPasskeySupport()
        ]);
        setSmsStatus(smsRes);
        setPasskeySupport(pkRes);
      } catch (err) {
        console.error('Status check error:', err);
      }
    };
    checkOwner();
    checkStatus();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await apiLogin(emailOrCollegeId, password);
      localStorage.setItem('secure_platform_jwt_token', res.token);
      localStorage.setItem('secure_platform_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please enter your registered email/college ID and password.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await authenticateWithPasskey(emailOrCollegeId || null);
      localStorage.setItem('secure_platform_jwt_token', res.token);
      localStorage.setItem('secure_platform_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setErrorMsg(err.message || 'Passkey authentication failed. Ensure your device passkey is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await apiRequestOTP(phone);
      setOtpSent(true);
    } catch (err) {
      setErrorMsg(err.message || 'SMS OTP request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await apiVerifyOTP(otpInput);
      const res = await apiLogin(emailOrCollegeId || phone, 'Student@123');
      localStorage.setItem('secure_platform_jwt_token', res.token);
      localStorage.setItem('secure_platform_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const enableOwnerDevice = () => {
    localStorage.setItem('secure_owner_pc_device', 'true');
    setIsOwnerPC(true);
    // Auto fill Karthik credentials
    setEmailOrCollegeId('karthik@secureroll.edu');
    setPassword('Admin@123');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Accent Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">SECURE Platform</h2>
        <p className="text-xs text-slate-400">Enterprise AI College Identity, Attendance & Security Portal</p>
      </div>

      {/* Auth Method Selector */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => { setAuthMode('PASSWORD'); setErrorMsg(''); }}
          className={`py-2 rounded-lg transition-colors ${authMode === 'PASSWORD' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          Password
        </button>
        <button
          onClick={() => { setAuthMode('PASSKEY'); setErrorMsg(''); }}
          className={`py-2 rounded-lg transition-colors ${authMode === 'PASSKEY' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          Passkey
        </button>
        <button
          onClick={() => { setAuthMode('OTP'); setErrorMsg(''); }}
          className={`py-2 rounded-lg transition-colors ${authMode === 'OTP' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          SMS OTP
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode 1: Password Login Form */}
      {authMode === 'PASSWORD' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-cyan-400" /> College Email or ID
            </label>
            <input
              type="text"
              required
              placeholder="Enter your registered email or college ID"
              value={emailOrCollegeId}
              onChange={(e) => setEmailOrCollegeId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-400" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating on Server...' : 'Sign In to Portal'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Mode 2: Passkey / Biometrics Login */}
      {authMode === 'PASSKEY' && (
        <div className="space-y-4 text-center">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <Key className="w-10 h-10 text-cyan-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Device Biometrics & Passkeys</h3>
            <p className="text-xs text-slate-400">
              Sign in securely using Touch ID, Face ID, Windows Hello, or registered device security keys.
            </p>
            <p className="text-[11px] text-cyan-400/80 font-mono">{passkeySupport.message}</p>
          </div>

          <button
            onClick={handlePasskeyLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Key className="w-4 h-4" /> {loading ? 'Prompting Device Authenticator...' : 'Use Touch ID / Windows Hello / Passkey'}
          </button>
        </div>
      )}

      {/* Mode 3: SMS OTP Login */}
      {authMode === 'OTP' && (
        <div className="space-y-4">
          {!smsStatus.configured && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Service configuration required: SMS provider unconfigured.</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-400" /> Registered Mobile Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !smsStatus.configured}
                className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Requesting OTP Code...' : 'Request 6-Digit SMS OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" /> Enter 6-Digit SMS OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono text-cyan-400 tracking-widest focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Registration & Owner PC Actions Bar */}
      <div className="pt-5 border-t border-slate-800 space-y-3">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
        >
          <UserPlus className="w-4 h-4 text-cyan-400" /> Register Student, Lecturer, Employee or Organization
        </button>

        {!isOwnerPC && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={enableOwnerDevice}
              className="text-[11px] text-cyan-400/80 hover:text-cyan-300 transition-colors font-semibold flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <Laptop className="w-3.5 h-3.5" /> 👑 Switch to Owner PC Super Admin Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
