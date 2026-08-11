import React, { useState, useEffect } from 'react';
import { Mail, Lock, ShieldAlert, ArrowRight, ShieldCheck, UserCheck, Key, AlertTriangle, Clock } from 'lucide-react';
import { getUsers } from '../../services/mockDataService';
import { hashSHA256, getDeviceLockoutStatus, recordFailedAttempt, resetDeviceAttempts, setActiveSessionToken, addAuditLog } from '../../services/securityService';

export default function Login({ onLoginSuccess, onSwitchToRegister, onForgotPassword }) {
  const [emailOrRoll, setEmailOrRoll] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutStatus, setLockoutStatus] = useState({ isFrozen: false, failedCount: 0 });

  // Check Device Lockout Status on mount
  const refreshLockout = () => {
    const status = getDeviceLockoutStatus();
    setLockoutStatus(status);
  };

  useEffect(() => {
    refreshLockout();
  }, []);

  // Handle Form Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Check device freeze status
    const currentLockout = getDeviceLockoutStatus();
    if (currentLockout.isFrozen) {
      setLockoutStatus(currentLockout);
      return;
    }

    setLoading(true);

    try {
      const users = getUsers();
      const inputClean = emailOrRoll.trim().toLowerCase();
      const user = users.find(u => 
        u.email.toLowerCase() === inputClean || u.rollNumber.toLowerCase() === inputClean
      );

      if (!user) {
        setLoading(false);
        const newLock = await recordFailedAttempt(`Unrecognized email or roll number: ${emailOrRoll}`);
        setLockoutStatus(newLock);
        setErrorMsg(`Invalid credentials. Attempt ${newLock.failedCount}/5. Account device will freeze for 24 hours on 5th failure.`);
        return;
      }

      const inputPasswordHash = await hashSHA256(password);
      if (user.passwordHash !== inputPasswordHash) {
        setLoading(false);
        const newLock = await recordFailedAttempt(`Password mismatch for user ${user.email}`);
        setLockoutStatus(newLock);
        setErrorMsg(`Incorrect password. Attempt ${newLock.failedCount}/5.`);
        return;
      }

      // Successful login -> Reset attempts and set active session token (multi-device restriction)
      resetDeviceAttempts();
      const sessionToken = setActiveSessionToken(user.id);

      await addAuditLog({
        action: 'USER_LOGIN_SUCCESS',
        userId: user.id,
        userRole: user.role,
        orgId: user.orgId,
        details: `Successful single-device session initialized (Token: ${sessionToken.substring(0, 10)}...)`
      });

      setLoading(false);
      onLoginSuccess(user);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Login error occurred.');
    }
  };

  // Quick Demo Login Helper
  const handleQuickDemoLogin = async (demoEmail) => {
    setEmailOrRoll(demoEmail);
    setPassword(demoEmail.includes('admin') || demoEmail.includes('hr') ? 'admin123' : 'pass123');
    
    // Auto submit demo
    setTimeout(() => {
      const formElem = document.getElementById('secureroll-login-form');
      if (formElem) formElem.requestSubmit();
    }, 200);
  };

  if (lockoutStatus.isFrozen) {
    return (
      <div className="w-full max-w-md mx-auto glass-panel rounded-3xl p-8 border border-rose-500/40 shadow-2xl text-center space-y-6 animate-pulse-ring">
        <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white">Device Access Frozen</h2>
          <p className="text-xs text-rose-300 font-semibold mt-1">24-Hour Security Lockout Triggered</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs space-y-2">
          <p className="flex items-center justify-center gap-1.5 font-bold">
            <Clock className="w-4 h-4 text-rose-400" /> Time Remaining: {lockoutStatus.remainingText || '23h 59m'}
          </p>
          <p className="text-[11px] text-slate-300">
            This device has been automatically frozen following 5 consecutive failed login/biometric attempts to protect member accounts.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              resetDeviceAttempts();
              const users = getUsers();
              const owner = users.find(u => u.id === 'USR-ADMIN-KARTHIK' || u.role === 'ADMIN') || users[0];
              if (owner) onLoginSuccess(owner);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            ⚡ Owner PC Override: Unfreeze & Enter Admin Panel
          </button>
          
          <button
            onClick={refreshLockout}
            className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-[11px] font-semibold transition-colors"
          >
            Check Lockout Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30 font-bold">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">SecureRoll Login</h2>
        <p className="text-xs text-slate-400">Enterprise Biometric Attendance Portal</p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Login Form */}
      <form id="secureroll-login-form" onSubmit={handleSubmit} className="space-y-4">
        
        {/* Email or Roll Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-cyan-400" /> Email or Roll / Employee ID
          </label>
          <input
            type="text"
            required
            placeholder="rohit.sharma@stxavier.edu or 2024-CS-108"
            value={emailOrRoll}
            onChange={(e) => setEmailOrRoll(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-400" /> Account Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
        >
          {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight className="w-4 h-4" />
        </button>

      </form>

      {/* Quick Demo Switcher */}
      <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
        <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
          Instant Demo Account Switcher
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleQuickDemoLogin('admin@secureroll.org')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors"
          >
            <p className="font-bold text-cyan-400">👑 Admin</p>
            <p className="text-[10px] text-slate-400 truncate">Dr. Rajesh Vardhan</p>
          </button>

          <button
            onClick={() => handleQuickDemoLogin('hr@apexcorp.com')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-left transition-colors"
          >
            <p className="font-bold text-purple-400">💼 HR Sub-Admin</p>
            <p className="text-[10px] text-slate-400 truncate">Priya Sundaram</p>
          </button>

          <button
            onClick={() => handleQuickDemoLogin('rohit.sharma@stxavier.edu')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors"
          >
            <p className="font-bold text-emerald-400">🎓 Student</p>
            <p className="text-[10px] text-slate-400 truncate">Rohit Sharma</p>
          </button>

          <button
            onClick={() => handleQuickDemoLogin('ananya.roy@apexcorp.com')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-left transition-colors"
          >
            <p className="font-bold text-blue-400">🏢 Employee</p>
            <p className="text-[10px] text-slate-400 truncate">Ananya Roy</p>
          </button>
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Don't have an account? <span className="font-semibold underline">Register New Member</span>
          </button>
        </div>
      </div>

    </div>
  );
}
