import React, { useState } from 'react';
import { Search, Download, Filter, X } from 'lucide-react';

interface TableToolbarProps {
    globalSearch: string;
    onGlobalSearchChange: (value: string) => void;
    onExportCSV: () => void;
    totalCount: number;
    filteredCount: number;
    children?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
    globalSearch,
    onGlobalSearchChange,
    onExportCSV,
    totalCount,
    filteredCount,
    children,
}) => {
    return (
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="전체 검색..."
                    value={globalSearch}
                    onChange={(e) => onGlobalSearchChange(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                {globalSearch && (
                    <button
                        onClick={() => onGlobalSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Column Visibility */}
                {children}

                {/* Export */}
                <button
                    onClick={onExportCSV}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Download size={16} />
                    <span>CSV 내보내기</span>
                </button>
            </div>
        </div>
    );
};

export default TableToolbar;
