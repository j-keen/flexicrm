import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { AppLayout } from './components/Layout/AppLayout';
import { Loader2, Database } from 'lucide-react';

// Pages
import { CustomerList } from './components/Pages/CustomerList';
import { SettingsPage } from './components/Pages/SettingsPage';
import { ReceptionManager } from './components/Pages/ReceptionManager';
import { PublicLandingPage } from './components/Pages/PublicLandingPage';

// Authenticated Route Wrapper
const AuthenticatedRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database size={32} className="text-white" />
          </div>
          <Loader2 size={32} className="animate-spin text-brand-400 mx-auto mb-2" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CustomerList />} />
        <Route path="/reception" element={<ReceptionManager />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/p/:slug" element={<PublicLandingPage />} />

          {/* Authenticated Application Routes */}
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
