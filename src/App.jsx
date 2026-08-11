import React, { useState, useEffect } from 'react';
import HeaderNavbar from './components/Pages/HeaderNavbar';
import Login from './components/Auth/Login';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import MemberDashboard from './components/Dashboard/MemberDashboard';
import PasskeyManager from './components/Security/PasskeyManager';
import SecurityCenter from './components/Security/SecurityCenter';
import ReportCenter from './components/Reports/ReportCenter';
import CollegeDataImporter from './components/Import/CollegeDataImporter';
import LiveAttendanceMonitor from './components/Attendance/LiveAttendanceMonitor';
import DynamicQRModal from './components/Attendance/DynamicQRModal';
import AIAssistantModal from './components/AI/AIAssistantModal';
import CommandCenter from './components/AI/CommandCenter';
import PrivacyPolicy from './components/Pages/PrivacyPolicy';
import { apiGetMe } from './services/api.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('DASHBOARD'); // DASHBOARD, PASSKEYS, SECURITY, REPORTS, IMPORT, LIVE_MONITOR, PRIVACY
  const [initialized, setInitialized] = useState(false);
  const [selectedLiveSessionId, setSelectedLiveSessionId] = useState(null);
  const [showDynamicQR, setShowDynamicQR] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('secure_platform_jwt_token');
      if (token) {
        try {
          const res = await apiGetMe();
          if (res.success && res.user) {
            setCurrentUser(res.user);
          } else {
            localStorage.removeItem('secure_platform_jwt_token');
          }
        } catch {
          localStorage.removeItem('secure_platform_jwt_token');
        }
      }
      setInitialized(true);
    };

    initSession();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActivePage('DASHBOARD');
  };

  const handleLogout = () => {
    localStorage.removeItem('secure_platform_jwt_token');
    localStorage.removeItem('secure_platform_user');
    setCurrentUser(null);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-3">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <p>Connecting to SECURE Platform Server...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      
      {/* Top Navbar */}
      <HeaderNavbar
        user={currentUser}
        onLogout={handleLogout}
        onNavigate={(page) => setActivePage(page)}
        activePage={activePage}
        onOpenAI={() => setShowAIAssistant(true)}
        onOpenCommand={() => setShowCommandCenter(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!currentUser ? (
          <div className="py-8 animate-in fade-in">
            <Login onLoginSuccess={handleLoginSuccess} />
          </div>
        ) : (
          <>
            {activePage === 'DASHBOARD' && (
              <div className="animate-in fade-in">
                {currentUser.role === 'STUDENT' ? (
                  <MemberDashboard user={currentUser} onNavigate={(p) => setActivePage(p)} />
                ) : (
                  <AdminDashboard
                    user={currentUser}
                    onNavigate={(p) => setActivePage(p)}
                    onStartLiveMonitor={(sessId) => {
                      setSelectedLiveSessionId(sessId);
                      setActivePage('LIVE_MONITOR');
                    }}
                  />
                )}
              </div>
            )}

            {activePage === 'PASSKEYS' && (
              <div className="animate-in fade-in">
                <PasskeyManager user={currentUser} />
              </div>
            )}

            {activePage === 'SECURITY' && (
              <div className="animate-in fade-in">
                <SecurityCenter />
              </div>
            )}

            {activePage === 'REPORTS' && (
              <div className="animate-in fade-in">
                <ReportCenter />
              </div>
            )}

            {activePage === 'IMPORT' && (
              <div className="animate-in fade-in">
                <CollegeDataImporter onComplete={() => setActivePage('DASHBOARD')} />
              </div>
            )}

            {activePage === 'LIVE_MONITOR' && selectedLiveSessionId && (
              <div className="animate-in fade-in">
                <LiveAttendanceMonitor
                  sessionId={selectedLiveSessionId}
                  onBack={() => setActivePage('DASHBOARD')}
                  onShowQR={() => setShowDynamicQR(true)}
                />
              </div>
            )}

            {activePage === 'PRIVACY' && (
              <div className="animate-in fade-in">
                <PrivacyPolicy onBack={() => setActivePage('DASHBOARD')} />
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 SECURE • Enterprise AI College Identity, Attendance & Security Intelligence Platform</p>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setActivePage('PRIVACY')} className="hover:text-cyan-400 transition-colors">
              Privacy Policy & DPDP Compliance
            </button>
            <span>•</span>
            <span>FIDO2 / WebAuthn Certified</span>
            <span>•</span>
            <span>AES-256 Checksum Verified</span>
          </div>
        </div>
      </footer>

      {/* AI Assistant Modal */}
      {currentUser && (
        <AIAssistantModal
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          user={currentUser}
        />
      )}

      {/* Command Palette */}
      {currentUser && (
        <CommandCenter
          isOpen={showCommandCenter}
          onClose={() => setShowCommandCenter(false)}
          onNavigate={(p) => setActivePage(p)}
          user={currentUser}
        />
      )}

      {/* Dynamic QR Modal */}
      {showDynamicQR && selectedLiveSessionId && (
        <DynamicQRModal
          isOpen={showDynamicQR}
          onClose={() => setShowDynamicQR(false)}
          session={{ id: selectedLiveSessionId, subject_name: 'Live Course', section: 'CSE-A' }}
        />
      )}

    </div>
  );
}
