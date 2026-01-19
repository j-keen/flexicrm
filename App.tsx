import React, { useState } from 'react';
import { FieldDefinition, CustomerRecord, DependencyRule, ModalSize, PERMISSIONS } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { FieldManager } from './components/Settings/FieldManager';
import { Table } from './components/CRM/Table';
import { RecordModal } from './components/CRM/RecordModal';
import { Database, Settings, Users, Plus, LogOut, Loader2, Shield } from 'lucide-react';

// Hooks
import { useCustomers } from './hooks/useCustomers';
import { useFields } from './hooks/useFields';
import { useAutomationRules } from './hooks/useAutomationRules';

// ============================================================================
// Main CRM App Component (requires authentication)
// ============================================================================

const CRMApp: React.FC = () => {
  const { user, profile, signOut, hasPermission, loading: authLoading } = useAuth();

  // View state
  const [activeView, setActiveView] = useState<'data' | 'settings'>('data');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | undefined>(undefined);
  const [modalSize, setModalSize] = useState<ModalSize>('lg');

  // Data hooks (use organization ID from profile)
  const organizationId = profile?.organization_id;
  const {
    customers,
    loading: customersLoading,
    addCustomer,
    editCustomer,
  } = useCustomers(organizationId);

  const {
    fields,
    loading: fieldsLoading,
    updateFields,
  } = useFields(organizationId);

  const {
    rules: dependencies,
    loading: rulesLoading,
    updateRules: setDependencies,
  } = useAutomationRules(organizationId);

  // Loading state
  const isLoading = customersLoading || fieldsLoading || rulesLoading;

  // Handlers
  const handleSaveRecord = async (record: CustomerRecord) => {
    const exists = customers.find(d => d.id === record.id);
    if (exists) {
      await editCustomer(record);
    } else if (organizationId) {
      await addCustomer(record, organizationId);
    }
  };

  const handleUpdateFields = (newFields: FieldDefinition[]) => {
    updateFields(newFields);
  };

  const handleUpdateDependencies = (newDeps: DependencyRule[]) => {
    setDependencies(newDeps);
  };



  const openNewRecordModal = () => {
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const openEditRecordModal = (record: CustomerRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  // Check permissions for settings access
  const canAccessSettings = hasPermission(PERMISSIONS.SCHEMA_FIELDS_READ);
  const canEditSchema = hasPermission(PERMISSIONS.SCHEMA_FIELDS_UPDATE);

  // Role badge
  const getRoleBadge = () => {
    if (!profile) return null;
    const roleLabels: Record<string, { label: string; color: string }> = {
      ceo: { label: 'CEO', color: 'bg-purple-500' },
      team_lead: { label: '팀장', color: 'bg-blue-500' },
      staff: { label: '직원', color: 'bg-gray-500' },
    };
    const role = roleLabels[profile.role] || roleLabels.staff;
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full text-white ${role.color}`}>
        {role.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">

      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Database size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">FlexiCRM</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveView('data')}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all ${activeView === 'data' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            <span className="font-medium">All Customers</span>
          </button>

          {canAccessSettings && (
            <button
              onClick={() => setActiveView('settings')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all ${activeView === 'settings' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings size={20} />
              <span className="font-medium">Setup & Schema</span>
            </button>
          )}
        </nav>

        {/* User info & logout */}
        <div className="p-4 border-t border-slate-800">
          {profile ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-white font-medium truncate">{profile.full_name}</span>
                {getRoleBadge()}
              </div>
              <div className="text-xs text-slate-500 mb-3">{profile.email}</div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <LogOut size={14} />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <div className="text-xs text-slate-500">User: Demo Mode</div>
              <div className="text-xs text-slate-500 mt-1">Status: Prototype</div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-2xl font-bold text-gray-800">
            {activeView === 'data' ? 'Customer Database' : 'System Configuration'}
          </h1>

          <div className="flex items-center gap-4">
            {/* Permission indicator */}
            {activeView === 'settings' && !canEditSchema && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
                <Shield size={16} />
                <span>읽기 전용</span>
              </div>
            )}

            {activeView === 'data' && (
              <button
                onClick={openNewRecordModal}
                className="flex items-center bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md shadow-md transition-transform active:scale-95 font-medium"
              >
                <Plus size={18} className="mr-2" />
                New Record
              </button>
            )}
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-hidden p-6 relative">
          {activeView === 'data' ? (
            <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <Table
                fields={fields}
                data={customers}
                onRowClick={openEditRecordModal}
              />
            </div>
          ) : (
            <FieldManager
              fields={fields}
              dependencies={dependencies}
              onUpdateFields={handleUpdateFields}
              onUpdateDependencies={handleUpdateDependencies}
              readOnly={!canEditSchema}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={editingRecord}
        fields={fields}
        dependencies={dependencies}
        onSave={handleSaveRecord}
        onUpdateFields={handleUpdateFields}
        modalSize={modalSize}
        onUpdateModalSize={setModalSize}
      />
    </div>
  );
};

// ============================================================================
// App Wrapper with Auth Provider
// ============================================================================

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// Content component that uses auth context
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Loading state
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

  // If not logged in, show login form
  if (!user) {
    return <LoginForm />;
  }

  // Logged in, show CRM
  return <CRMApp />;
};

export default App;
