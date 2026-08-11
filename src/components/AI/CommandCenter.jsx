import React, { useState, useEffect } from 'react';
import { Search, Command, User, Shield, FileText, QrCode, Key, X, Sparkles } from 'lucide-react';

export default function CommandCenter({ isOpen, onClose, onNavigate, user }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'act-1', title: 'Open Security & Passkeys Manager', category: 'Security', icon: Key, action: () => onNavigate('PASSKEYS') },
    { id: 'act-2', title: 'View Security Intelligence Center', category: 'Security', icon: Shield, action: () => onNavigate('SECURITY') },
    { id: 'act-3', title: 'Generate Attendance Report', category: 'Reports', icon: FileText, action: () => onNavigate('REPORTS') },
    { id: 'act-4', title: 'Import College CSV / Excel Data', category: 'Admin', icon: User, action: () => onNavigate('IMPORT') },
    { id: 'act-5', title: 'Start Dynamic QR Attendance Session', category: 'Attendance', icon: QrCode, action: () => onNavigate('ACTIVE_SESSION') }
  ];

  const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search action (e.g. Passkeys, Reports, Security)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white focus:outline-none"
          />
          <kbd className="hidden sm:inline-block text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-700">ESC to exit</kbd>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-800/40 text-xs">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No matching commands found.</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full p-3 px-4 flex items-center justify-between hover:bg-cyan-500/10 text-left transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium text-slate-200">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{item.category}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
