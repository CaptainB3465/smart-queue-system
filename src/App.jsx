import React, { useState } from 'react';
import { QueueProvider, useQueue } from './context/QueueContext';
import CustomerView from './components/CustomerView';
import DisplayView from './components/DisplayView';
import AdminPanel from './components/AdminPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsView from './components/SettingsView';
import Auth from './components/Auth';
import QueueWorker from './workers/queueWorker';
import './index.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('customer');
  const { user, authLoading, logout, userProfile } = useQueue();

  if (authLoading) {
    return <div className="loading-screen">Loading Auth...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
      <div className="app-main">
        <header className="app-header">
          <div className="brand">
            <div className="logo">SQ</div>
            <h1>{userProfile?.brandName || 'Smart Queue'} <span className="premium-tag">Advanced</span></h1>
          </div>
          <nav className="tab-navigation">
            <button 
              className={activeTab === 'customer' ? 'active' : ''} 
              onClick={() => setActiveTab('customer')}
            >
              Join
            </button>
            <button 
              className={activeTab === 'display' ? 'active' : ''} 
              onClick={() => setActiveTab('display')}
            >
              TV
            </button>
            <button 
              className={activeTab === 'admin' ? 'active' : ''} 
              onClick={() => setActiveTab('admin')}
            >
              Staff
            </button>
            <button 
              className={activeTab === 'analytics' ? 'active' : ''} 
              onClick={() => setActiveTab('analytics')}
            >
              Stats
            </button>
            <button 
              className={activeTab === 'settings' ? 'active' : ''} 
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
          <div className="user-profile">
            <span className="user-email">{user.email}</span>
            <button className="btn-small btn-secondary" onClick={logout}>Logout</button>
          </div>
        </header>

        <main className="content-area">
          {activeTab === 'customer' && <CustomerView />}
          {activeTab === 'display' && <DisplayView />}
          {activeTab === 'admin' && <AdminPanel />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
        {/* Global worker - always active regardless of tab */}
        <div style={{ display: 'none' }}>
          <QueueWorker />
        </div>
        
        <footer className="app-footer glass">
          <div className="footer-status">
            <span className="dot pulse-green"></span> System Live (Real-time)
          </div>
          <p>&copy; 2026 SQ Management v2.0</p>
        </footer>
      </div>
  );
}

function App() {
  return (
    <QueueProvider>
      <AppContent />
    </QueueProvider>
  );
}

export default App;
