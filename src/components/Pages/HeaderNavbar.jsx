import React from 'react';
import { ShieldCheck, LogOut, User, Building2, Lock, Shield, FileText } from 'lucide-react';

export default function HeaderNavbar({ user, onLogout, onNavigate, activePage }) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onNavigate('DASHBOARD')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white font-outfit">Secure<span className="text-cyan-400">Roll</span></span>
              <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                ENTERPRISE v2.6
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide">Multi-Organization Biometric Attendance</p>
          </div>
        </div>

        {/* Navigation & User Menu */}
        <div className="flex items-center gap-4">
          
          <button
            onClick={() => onNavigate('PRIVACY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${activePage === 'PRIVACY' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <Shield className="w-4 h-4 text-emerald-400" /> Privacy & Compliance
          </button>

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              
              {/* User Profile Card */}
              <div className="hidden sm:flex items-center gap-3 text-right">
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">{user.role}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.orgName}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  {user.name ? user.name[0] : 'U'}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>

            </div>
          ) : (
            <button
              onClick={() => onNavigate('LOGIN')}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
