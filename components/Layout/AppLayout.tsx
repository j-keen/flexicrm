import React from 'react';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';
import { PERMISSIONS } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const AppLayout: React.FC = () => {
    const { hasPermission } = useAuth();
    const canAccessSettings = hasPermission(PERMISSIONS.SCHEMA_FIELDS_READ);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <Header canAccessSettings={canAccessSettings} />

            {/* Main Content - Offset for fixed header */}
            <main className="flex-1 pt-16 relative">
                <div className="h-[calc(100vh-4rem)] overflow-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
