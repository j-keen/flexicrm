import React, { useState, useRef, useEffect } from 'react';
import { Columns, Check, Eye, EyeOff } from 'lucide-react';
import { FieldDefinition } from '../../../types';

interface ColumnVisibilityMenuProps {
    fields: FieldDefinition[];
    visibleColumns: Set<string>;
    onToggle: (columnId: string) => void;
}

export const ColumnVisibilityMenu: React.FC<ColumnVisibilityMenuProps> = ({
    fields,
    visibleColumns,
    onToggle,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const visibleCount = visibleColumns.size;
    const totalCount = fields.length;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${isOpen
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <Columns size={16} />
                <span>컬럼 ({visibleCount}/{totalCount})</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                        컬럼 보이기/숨기기
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {fields
                            .sort((a, b) => a.order - b.order)
                            .map(field => {
                                const isVisible = visibleColumns.has(field.id);
                                return (
                                    <button
                                        key={field.id}
                                        onClick={() => onToggle(field.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <div
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isVisible
                                                ? 'bg-brand-600 border-brand-600 text-white'
                                                : 'border-gray-300'
                                                }`}
                                        >
                                            {isVisible && <Check size={12} />}
                                        </div>
                                        <span className={isVisible ? 'text-gray-900' : 'text-gray-500'}>
                                            {field.name}
                                        </span>
                                        {isVisible ? (
                                            <Eye size={14} className="ml-auto text-gray-400" />
                                        ) : (
                                            <EyeOff size={14} className="ml-auto text-gray-300" />
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColumnVisibilityMenu;
