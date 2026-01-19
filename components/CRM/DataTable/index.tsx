import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { CustomerRecord, FieldDefinition } from '../../../types';
import { Badge } from '../../ui/Badge';
import { TableToolbar } from './TableToolbar';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { BulkActionsBar } from './BulkActionsBar';
import {
    ChevronUp,
    ChevronDown,
    GripVertical,
    Check,
    Minus,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ColumnConfig {
    id: string;
    width: number;
    visible: boolean;
    order: number;
}

export interface SortConfig {
    columnId: string;
    direction: 'asc' | 'desc';
}

export interface FilterConfig {
    columnId: string;
    value: string;
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
}

interface DataTableProps {
    fields: FieldDefinition[];
    data: CustomerRecord[];
    onRowClick: (record: CustomerRecord) => void;
    onUpdateFields?: (fields: FieldDefinition[]) => void;
    onBulkDelete?: (ids: string[]) => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_COLUMN_WIDTH = 80;
const DEFAULT_COLUMN_WIDTH = 150;
const ROW_HEIGHT = 48;
const VISIBLE_ROWS_BUFFER = 5;

// ============================================================================
// DataTable Component
// ============================================================================

export const DataTable: React.FC<DataTableProps> = ({
    fields,
    data,
    onRowClick,
    onUpdateFields,
    onBulkDelete,
}) => {
    // ========== State ==========
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [globalSearch, setGlobalSearch] = useState('');
    const [columnFilters, setColumnFilters] = useState<FilterConfig[]>([]);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [columnOrder, setColumnOrder] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

    // Virtual scrolling state
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag state for column reordering
    const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Resize state
    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const resizeStartX = useRef(0);
    const resizeStartWidth = useRef(0);

    // ========== Initialize column config from fields ==========
    useEffect(() => {
        const newVisibleColumns = new Set(
            fields.filter(f => f.visible).map(f => f.id)
        );
        setVisibleColumns(newVisibleColumns);

        const newOrder = fields
            .sort((a, b) => a.order - b.order)
            .map(f => f.id);
        setColumnOrder(newOrder);

        const newWidths: Record<string, number> = {};
        fields.forEach(f => {
            newWidths[f.id] = f.width || DEFAULT_COLUMN_WIDTH;
        });
        setColumnWidths(newWidths);
    }, [fields]);

    // ========== Computed: Active (visible & ordered) Fields ==========
    const activeFields = useMemo(() => {
        return columnOrder
            .filter(id => visibleColumns.has(id))
            .map(id => fields.find(f => f.id === id))
            .filter((f): f is FieldDefinition => f !== undefined);
    }, [fields, columnOrder, visibleColumns]);

    // ========== Computed: Filtered & Sorted Data ==========
    const processedData = useMemo(() => {
        let result = [...data];

        // Global search
        if (globalSearch.trim()) {
            const searchLower = globalSearch.toLowerCase();
            result = result.filter(record =>
                activeFields.some(field => {
                    const value = record[field.id];
                    if (value == null) return false;
                    return String(value).toLowerCase().includes(searchLower);
                })
            );
        }

        // Column filters
        columnFilters.forEach(filter => {
            result = result.filter(record => {
                const value = record[filter.columnId];
                if (value == null) return false;
                const strValue = String(value).toLowerCase();
                const filterValue = filter.value.toLowerCase();

                switch (filter.operator) {
                    case 'contains': return strValue.includes(filterValue);
                    case 'equals': return strValue === filterValue;
                    case 'startsWith': return strValue.startsWith(filterValue);
                    case 'endsWith': return strValue.endsWith(filterValue);
                    default: return true;
                }
            });
        });

        // Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.columnId];
                const bVal = b[sortConfig.columnId];

                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                let comparison = 0;
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal;
                } else {
                    comparison = String(aVal).localeCompare(String(bVal));
                }

                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [data, globalSearch, columnFilters, sortConfig, activeFields]);

    // ========== Virtual Scrolling ==========
    const containerHeight = containerRef.current?.clientHeight || 600;
    const totalHeight = processedData.length * ROW_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - VISIBLE_ROWS_BUFFER);
    const endIndex = Math.min(
        processedData.length,
        Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + VISIBLE_ROWS_BUFFER
    );
    const visibleData = processedData.slice(startIndex, endIndex);
    const offsetY = startIndex * ROW_HEIGHT;

    // ========== Selection Handlers ==========
    const handleSelectAll = useCallback(() => {
        if (selectedIds.size === processedData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(processedData.map(r => r.id)));
        }
    }, [processedData, selectedIds.size]);

    const handleSelectRow = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const isAllSelected = processedData.length > 0 && selectedIds.size === processedData.length;
    const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < processedData.length;

    // ========== Sort Handler ==========
    const handleSort = useCallback((columnId: string) => {
        setSortConfig(prev => {
            if (prev?.columnId === columnId) {
                if (prev.direction === 'asc') {
                    return { columnId, direction: 'desc' };
                }
                return null; // Third click removes sort
            }
            return { columnId, direction: 'asc' };
        });
    }, []);

    // ========== Column Resize Handlers ==========
    const handleResizeStart = useCallback((columnId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(columnId);
        resizeStartX.current = e.clientX;
        resizeStartWidth.current = columnWidths[columnId] || DEFAULT_COLUMN_WIDTH;
    }, [columnWidths]);

    useEffect(() => {
        if (!resizingColumn) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - resizeStartX.current;
            const newWidth = Math.max(MIN_COLUMN_WIDTH, resizeStartWidth.current + delta);
            setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
        };

        const handleMouseUp = () => {
            setResizingColumn(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingColumn]);

    // ========== Column Drag Reorder Handlers ==========
    const handleDragStart = useCallback((columnId: string) => {
        setDraggedColumn(columnId);
    }, []);

    const handleDragOver = useCallback((columnId: string, e: React.DragEvent) => {
        e.preventDefault();
        if (draggedColumn && columnId !== draggedColumn) {
            setDragOverColumn(columnId);
        }
    }, [draggedColumn]);

    const handleDrop = useCallback((targetColumnId: string) => {
        if (!draggedColumn || draggedColumn === targetColumnId) {
            setDraggedColumn(null);
            setDragOverColumn(null);
            return;
        }

        setColumnOrder(prev => {
            const newOrder = [...prev];
            const draggedIndex = newOrder.indexOf(draggedColumn);
            const targetIndex = newOrder.indexOf(targetColumnId);

            newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, draggedColumn);

            return newOrder;
        });

        setDraggedColumn(null);
        setDragOverColumn(null);
    }, [draggedColumn]);

    // ========== Column Visibility Handler ==========
    const handleToggleColumnVisibility = useCallback((columnId: string) => {
        setVisibleColumns(prev => {
            const next = new Set(prev);
            if (next.has(columnId)) {
                next.delete(columnId);
            } else {
                next.add(columnId);
            }
            return next;
        });
    }, []);

    // ========== Bulk Actions ==========
    const handleBulkDelete = useCallback(async () => {
        if (onBulkDelete && selectedIds.size > 0) {
            await onBulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    }, [onBulkDelete, selectedIds]);

    const handleClearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // ========== Cell Renderer ==========
    const renderCell = (record: CustomerRecord, field: FieldDefinition) => {
        const value = record[field.id];

        if (value === undefined || value === null) {
            return <span className="text-gray-400">-</span>;
        }

        if (field.type === 'select' && field.options) {
            const option = field.options.find(o => o.id === value);
            if (option) {
                return <Badge colorClass={option.color} label={option.label} />;
            }
            return value;
        }

        if (field.type === 'currency') {
            return new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW',
            }).format(Number(value));
        }

        if (field.type === 'date') {
            return new Date(value).toLocaleDateString('ko-KR');
        }

        return <span className="text-gray-900 truncate">{String(value)}</span>;
    };

    // ========== Export CSV ==========
    const handleExportCSV = useCallback(() => {
        const headers = activeFields.map(f => f.name);
        const rows = processedData.map(record =>
            activeFields.map(field => {
                const value = record[field.id];
                if (value == null) return '';
                if (field.type === 'select' && field.options) {
                    const option = field.options.find(o => o.id === value);
                    return option?.label || value;
                }
                return String(value);
            })
        );

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }, [activeFields, processedData]);

    // ========== Scroll Handler ==========
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // ========== Render ==========
    return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
            {/* Toolbar */}
            <TableToolbar
                globalSearch={globalSearch}
                onGlobalSearchChange={setGlobalSearch}
                onExportCSV={handleExportCSV}
                totalCount={data.length}
                filteredCount={processedData.length}
            >
                <ColumnVisibilityMenu
                    fields={fields}
                    visibleColumns={visibleColumns}
                    onToggle={handleToggleColumnVisibility}
                />
            </TableToolbar>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onDelete={onBulkDelete ? handleBulkDelete : undefined}
                    onClearSelection={handleClearSelection}
                />
            )}

            {/* Table Container */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0">
                    <div className="flex">
                        {/* Checkbox Column */}
                        <div className="w-12 px-3 py-3 flex items-center justify-center border-r border-gray-200">
                            <button
                                onClick={handleSelectAll}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isAllSelected
                                    ? 'bg-brand-600 border-brand-600 text-white'
                                    : isPartiallySelected
                                        ? 'bg-brand-100 border-brand-600 text-brand-600'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {isAllSelected && <Check size={14} />}
                                {isPartiallySelected && <Minus size={14} />}
                            </button>
                        </div>

                        {/* Data Columns */}
                        {activeFields.map(field => (
                            <div
                                key={field.id}
                                className={`relative flex items-center px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider select-none ${dragOverColumn === field.id ? 'bg-brand-50 border-l-2 border-brand-500' : ''
                                    }`}
                                style={{ width: columnWidths[field.id] || DEFAULT_COLUMN_WIDTH, minWidth: MIN_COLUMN_WIDTH }}
                                draggable
                                onDragStart={() => handleDragStart(field.id)}
                                onDragOver={(e) => handleDragOver(field.id, e)}
                                onDrop={() => handleDrop(field.id)}
                                onDragEnd={() => {
                                    setDraggedColumn(null);
                                    setDragOverColumn(null);
                                }}
                            >
                                {/* Drag Handle */}
                                <GripVertical
                                    size={14}
                                    className="mr-2 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
                                />

                                {/* Column Name + Sort */}
                                <button
                                    onClick={() => handleSort(field.id)}
                                    className="flex items-center gap-1 hover:text-gray-900 flex-1 truncate"
                                >
                                    <span className="truncate">{field.name}</span>
                                    {sortConfig?.columnId === field.id && (
                                        sortConfig.direction === 'asc' ? (
                                            <ChevronUp size={14} className="text-brand-600 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown size={14} className="text-brand-600 flex-shrink-0" />
                                        )
                                    )}
                                </button>

                                {/* Resize Handle */}
                                <div
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-500 group"
                                    onMouseDown={(e) => handleResizeStart(field.id, e)}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-300 group-hover:bg-brand-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body with Virtual Scrolling */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto"
                    onScroll={handleScroll}
                >
                    <div style={{ height: totalHeight, position: 'relative' }}>
                        <div style={{ transform: `translateY(${offsetY}px)` }}>
                            {visibleData.map(record => (
                                <div
                                    key={record.id}
                                    onClick={() => onRowClick(record)}
                                    className={`flex border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.has(record.id) ? 'bg-brand-50' : ''
                                        }`}
                                    style={{ height: ROW_HEIGHT }}
                                >
                                    {/* Checkbox */}
                                    <div className="w-12 px-3 flex items-center justify-center border-r border-gray-100">
                                        <button
                                            onClick={(e) => handleSelectRow(record.id, e)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.has(record.id)
                                                ? 'bg-brand-600 border-brand-600 text-white'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {selectedIds.has(record.id) && <Check size={14} />}
                                        </button>
                                    </div>

                                    {/* Data Cells */}
                                    {activeFields.map(field => (
                                        <div
                                            key={field.id}
                                            className="px-4 flex items-center text-sm text-gray-600 overflow-hidden"
                                            style={{ width: columnWidths[field.id] || DEFAULT_COLUMN_WIDTH, minWidth: MIN_COLUMN_WIDTH }}
                                        >
                                            {renderCell(record, field)}
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {/* Empty State */}
                            {processedData.length === 0 && (
                                <div className="flex items-center justify-center py-16 text-gray-500">
                                    {globalSearch || columnFilters.length > 0
                                        ? '검색 결과가 없습니다.'
                                        : '등록된 고객이 없습니다. 새 고객을 추가해보세요.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                <div>
                    {selectedIds.size > 0 && (
                        <span className="font-medium text-brand-600">{selectedIds.size}개 선택됨 · </span>
                    )}
                    총 {processedData.length.toLocaleString()}개
                    {processedData.length !== data.length && (
                        <span className="text-gray-400"> (전체 {data.length.toLocaleString()}개 중)</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataTable;
