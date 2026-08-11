import React from 'react';
import { ShieldCheck, Command, Bot, LogOut, Key, FileText, Upload, ShieldAlert, User } from 'lucide-react';

export default function HeaderNavbar({ user, onLogout, onNavigate, activePage, onOpenAI, onOpenCommand }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div
          onClick={() => onNavigate('DASHBOARD')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-white tracking-wider">SECURE</span>
            <span className="text-[10px] block font-mono text-cyan-400 -mt-1 font-semibold">COLLEGE IDENTITY</span>
          </div>
        </div>

        {/* Action Buttons */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Command Palette Trigger */}
            <button
              onClick={onOpenCommand}
              className="hidden sm:flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition-colors"
            >
              <Command className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search actions...</span>
              <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Ctrl+K</kbd>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAI}
              className="py-2 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Bot className="w-4 h-4" /> <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* Navigation links */}
            <button
              onClick={() => onNavigate('PASSKEYS')}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${activePage === 'PASSKEYS' ? 'text-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-white'}`}
              title="Passkeys & Devices"
            >
              <Key className="w-4 h-4" /> <span className="hidden md:inline">Passkeys</span>
            </button>

            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
              <button
                onClick={() => onNavigate('SECURITY')}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${activePage === 'SECURITY' ? 'text-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-white'}`}
                title="Security Intelligence Center"
              >
                <ShieldAlert className="w-4 h-4" /> <span className="hidden md:inline">Security</span>
              </button>
            )}

            {/* User Profile Badge */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right hidden md:block text-xs">
                <p className="font-bold text-white leading-none">{user.name}</p>
                <span className="text-[10px] font-mono text-cyan-400">{user.role}</span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
