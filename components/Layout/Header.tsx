import React from 'react';
import { Database, Users, Settings, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
    canAccessSettings: boolean;
}

export const Header: React.FC<HeaderProps> = ({ canAccessSettings }) => {
    const { profile, signOut } = useAuth();
    const location = useLocation();

    const getRoleBadge = () => {
        if (!profile) return null;
        const roleLabels: Record<string, { label: string; color: string }> = {
            ceo: { label: 'CEO', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            team_lead: { label: 'Team Lead', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            staff: { label: 'Staff', color: 'bg-gray-100 text-gray-700 border-gray-200' },
        };
        const role = roleLabels[profile.role] || roleLabels.staff;
        return (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${role.color}`}>
                {role.label}
            </span>
        );
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-30 fixed top-0 left-0 right-0">
            <div className="flex items-center gap-8">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                        <Database size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-xl text-gray-900 tracking-tight">FlexiCRM</span>
                </div>

                {/* Navigation */}
                <nav className="flex items-center space-x-1">
                    <Link
                        to="/"
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')
                                ? 'bg-brand-50 text-brand-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Users size={18} />
                        <span>Customers</span>
                    </Link>

                    <Link
                        to="/reception"
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/reception')
                                ? 'bg-brand-50 text-brand-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Radio size={18} />
                        <span>Reception</span>
                    </Link>

                    {canAccessSettings && (
                        <Link
                            to="/settings"
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/settings')
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Settings size={18} />
                            <span>Settings</span>
                        </Link>
                    )}
                </nav>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4">
                {profile && (
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-gray-900">{profile.full_name}</div>
                            <div className="text-xs text-gray-500">{profile.email}</div>
                        </div>
                        {getRoleBadge()}
                        <button
                            onClick={signOut}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};
