import React, { useState } from 'react';
import { FieldDefinition, CustomerRecord, DependencyRule, ModalSize } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { DataTable } from '../CRM/DataTable';
import { RecordModal } from '../CRM/RecordModal';
import { Loader2, Plus } from 'lucide-react';

// Hooks
import { useCustomers } from '../../hooks/useCustomers';
import { useFields } from '../../hooks/useFields';
import { useAutomationRules } from '../../hooks/useAutomationRules';

export const CustomerList: React.FC = () => {
    const { profile } = useAuth();

    // View state
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
        removeCustomer,
    } = useCustomers(organizationId);

    const {
        fields,
        loading: fieldsLoading,
        updateFields,
    } = useFields(organizationId);

    const {
        rules: dependencies,
        loading: rulesLoading,
        updateRules: setDependencies, // Note: RecordModal might need this if it updates rules, but checking App.tsx it seemed to pass dependencies prop.
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

    const openNewRecordModal = () => {
        setEditingRecord(undefined);
        setIsModalOpen(true);
    };

    const openEditRecordModal = (record: CustomerRecord) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 size={32} className="animate-spin text-brand-600 mb-4" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Page Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">
                    Customer Database
                </h1>
                <button
                    onClick={openNewRecordModal}
                    className="flex items-center bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md shadow-sm transition-transform active:scale-95 font-medium text-sm"
                >
                    <Plus size={16} className="mr-2" />
                    New Record
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6">
                <DataTable
                    fields={fields}
                    data={customers}
                    onRowClick={openEditRecordModal}
                    onUpdateFields={handleUpdateFields}
                    onBulkDelete={async (ids) => {
                        for (const id of ids) {
                            await removeCustomer(id);
                        }
                    }}
                />
            </div>

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
