import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import type { UserProfile } from '../../types';

interface CreateTeamModalProps {
    members: UserProfile[];
    onClose: () => void;
    onCreate: (name: string, leadId?: string) => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
    members,
    onClose,
    onCreate,
}) => {
    const [name, setName] = useState('');
    const [leadId, setLeadId] = useState<string>('');

    // 팀장 후보자 (CEO 또는 Team Lead 역할)
    const leaderCandidates = members.filter(
        (m) => m.is_active && (m.role === 'ceo' || m.role === 'team_lead')
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name.trim(), leadId || undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-brand-600" />
                        </div>
                        <h2 className="text-lg font-semibold">새 팀 만들기</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* 팀 이름 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            팀 이름 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="예: 영업1팀"
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            autoFocus
                        />
                    </div>

                    {/* 팀장 선택 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            팀장 (선택)
                        </label>
                        <select
                            value={leadId}
                            onChange={(e) => setLeadId(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        >
                            <option value="">팀장 없음</option>
                            {leaderCandidates.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.full_name} ({m.role === 'ceo' ? 'CEO' : '팀장'})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            CEO 또는 팀장 역할의 멤버만 선택 가능합니다
                        </p>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            생성
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;
