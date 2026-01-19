import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface BulkActionsBarProps {
    selectedCount: number;
    onDelete?: () => Promise<void>;
    onClearSelection: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedCount,
    onDelete,
    onClearSelection,
}) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete();
            setShowConfirm(false);
        } catch (error) {
            console.error('Bulk delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="px-4 py-2 bg-brand-50 border-b border-brand-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-brand-700">
                        {selectedCount}개 선택됨
                    </span>

                    {onDelete && (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={14} />
                            <span>삭제</span>
                        </button>
                    )}
                </div>

                <button
                    onClick={onClearSelection}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                    <X size={14} />
                    <span>선택 해제</span>
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">삭제 확인</h3>
                                <p className="text-sm text-gray-600">이 작업은 되돌릴 수 없습니다.</p>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-6">
                            선택한 <strong className="text-red-600">{selectedCount}개</strong>의 고객 데이터를 삭제하시겠습니까?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? '삭제 중...' : '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BulkActionsBar;
