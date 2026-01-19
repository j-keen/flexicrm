import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FieldManager } from '../Settings/FieldManager';
import { Loader2, Shield } from 'lucide-react';
import { PERMISSIONS } from '../../types';

// Hooks
import { useFields } from '../../hooks/useFields';
import { useAutomationRules } from '../../hooks/useAutomationRules';

export const SettingsPage: React.FC = () => {
    const { profile, hasPermission } = useAuth();
    const organizationId = profile?.organization_id;

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

    const canEditSchema = hasPermission(PERMISSIONS.SCHEMA_FIELDS_UPDATE);
    const isLoading = fieldsLoading || rulesLoading;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 size={32} className="animate-spin text-brand-600 mb-4" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">
                    System Configuration
                </h1>
                {!canEditSchema && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
                        <Shield size={16} />
                        <span>Read Only</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden p-6">
                <FieldManager
                    fields={fields}
                    dependencies={dependencies}
                    onUpdateFields={updateFields}
                    onUpdateDependencies={setDependencies}
                    readOnly={!canEditSchema}
                />
            </div>
        </div>
    );
};
