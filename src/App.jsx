import React, { useState, useEffect } from 'react';
import HeaderNavbar from './components/Pages/HeaderNavbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import MemberDashboard from './components/Dashboard/MemberDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import PrivacyPolicy from './components/Pages/PrivacyPolicy';
import { initializeMockDatabase, getUsers } from './services/mockDataService';
import { resetDeviceAttempts, validateActiveSession } from './services/securityService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('LOGIN'); // LOGIN, REGISTER, DASHBOARD, PRIVACY
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // Unfreeze device lockouts on launch for owner PC
      resetDeviceAttempts();
      await initializeMockDatabase();
      const users = getUsers();

      // Direct PC Owner Auto-Login: Always land on Karthik's Admin Profile on this device
      const karthikOwner = users.find(u => u.id === 'USR-ADMIN-KARTHIK' || u.name.toLowerCase() === 'karthik') || users.find(u => u.role === 'ADMIN') || users[0];
      if (karthikOwner) {
        setCurrentUser(karthikOwner);
        localStorage.setItem('secureroll_logged_user_id', karthikOwner.id);
        setActivePage('DASHBOARD');
      }
      setInitialized(true);
    };

    initApp();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('secureroll_logged_user_id', user.id);
    setActivePage('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('secureroll_logged_user_id');
    localStorage.removeItem('secureroll_current_session_token');
    setActivePage('LOGIN');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-3">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <p>Initializing SecureRoll Cryptographic Storage...</p>
      </div>
    );
  }

  const handleSwitchRole = (role) => {
    const users = getUsers();
    let target = users.find(u => u.role === role);
    if (!target) target = users[0];
    setCurrentUser(target);
    localStorage.setItem('secureroll_logged_user_id', target.id);
    setActivePage('DASHBOARD');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      
      {/* Top Navbar */}
      <HeaderNavbar
        user={currentUser}
        onLogout={handleLogout}
        onNavigate={(page) => setActivePage(page)}
        activePage={activePage}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activePage === 'LOGIN' && (
          <div className="py-8 animate-in fade-in">
            <Login
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setActivePage('REGISTER')}
              onForgotPassword={() => setShowForgotModal(true)}
            />
          </div>
        )}

        {activePage === 'REGISTER' && (
          <div className="py-4 animate-in fade-in">
            <Register
              onSwitchToLogin={() => setActivePage('LOGIN')}
              onRegisterSuccess={(user) => handleLoginSuccess(user)}
            />
          </div>
        )}

        {activePage === 'DASHBOARD' && currentUser && (
          <div className="animate-in fade-in">
            {currentUser.role === 'ADMIN' || currentUser.role === 'SUB_ADMIN' ? (
              <AdminDashboard user={currentUser} />
            ) : (
              <MemberDashboard user={currentUser} onUpdateUser={(u) => setCurrentUser(u)} />
            )}
          </div>
        )}

        {activePage === 'PRIVACY' && (
          <div className="animate-in fade-in">
            <PrivacyPolicy onBack={() => setActivePage(currentUser ? 'DASHBOARD' : 'LOGIN')} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 SecureRoll • Enterprise Biometric Attendance & Verification System</p>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setActivePage('PRIVACY')} className="hover:text-cyan-400 transition-colors">
              Privacy Policy & DPDP Compliance
            </button>
            <span>•</span>
            <span>AES-256 Encrypted</span>
            <span>•</span>
            <span>Multi-Tenant Architecture</span>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      <ForgotPassword
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />

    </div>
  );
}
