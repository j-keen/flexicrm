import React, { useState } from 'react';
import { X, UserPlus, Copy, Check, AlertCircle } from 'lucide-react';
import type { Team, UserRole, CreateMemberInput, MemberCreationSQL } from '../../types';
import { generateMemberCreationSQL } from '../../services/supabase';

interface CreateMemberModalProps {
    teams: Team[];
    defaultTeamId?: string;
    onClose: () => void;
    onCreated: () => void;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
    teams,
    defaultTeamId,
    onClose,
    onCreated,
}) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('staff');
    const [teamId, setTeamId] = useState(defaultTeamId || '');
    const [generatedSQL, setGeneratedSQL] = useState<MemberCreationSQL | null>(null);
    const [copied, setCopied] = useState<'sql' | 'credentials' | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !username.trim() || !password.trim()) return;

        setLoading(true);
        const input: CreateMemberInput = {
            fullName: fullName.trim(),
            username: username.trim(),
            password: password.trim(),
            role,
            teamId: teamId || undefined,
        };

        const result = await generateMemberCreationSQL(input);
        setGeneratedSQL(result);
        setLoading(false);
    };

    const copyToClipboard = async (text: string, type: 'sql' | 'credentials') => {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const credentialsText = generatedSQL
        ? `아이디: ${generatedSQL.credentials.username}\n비밀번호: ${generatedSQL.credentials.password}`
        : '';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <UserPlus className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-lg font-semibold">새 멤버 계정 생성</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 폼 */}
                {!generatedSQL ? (
                    <form onSubmit={handleGenerate} className="p-5 space-y-4">
                        {/* 이름 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                이름 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="예: 홍길동"
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                autoFocus
                            />
                        </div>

                        {/* 아이디 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                아이디 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                    placeholder="예: hong"
                                    className="flex-1 px-4 py-3 border rounded-l-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                                <span className="px-4 py-3 bg-gray-100 border border-l-0 rounded-r-lg text-gray-500">
                                    @crm.team
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                영문, 숫자, -, _만 사용 가능
                            </p>
                        </div>

                        {/* 비밀번호 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="예: 1234"
                                    className="flex-1 px-4 py-3 border rounded-l-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                                <span className="px-4 py-3 bg-gray-100 border border-l-0 rounded-r-lg text-gray-500">
                                    ##crm
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                실제 저장: {password || '****'}##crm
                            </p>
                        </div>

                        {/* 역할 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                역할 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                {(['ceo', 'team_lead', 'staff'] as UserRole[]).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${role === r
                                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {r === 'ceo' ? 'CEO' : r === 'team_lead' ? '팀장' : '사원'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 팀 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                소속 팀
                            </label>
                            <select
                                value={teamId}
                                onChange={(e) => setTeamId(e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            >
                                <option value="">미배정</option>
                                {teams.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
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
                                disabled={!fullName.trim() || !username.trim() || !password.trim() || loading}
                                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? '생성 중...' : 'SQL 생성'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-5 space-y-4">
                        {/* 안내 */}
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">SQL을 Supabase에서 실행하세요</p>
                                <p>Supabase Dashboard → SQL Editor에서 아래 SQL을 실행하면 계정이 생성됩니다.</p>
                            </div>
                        </div>

                        {/* 계정 정보 */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">
                                    📋 계정 정보 (전달용)
                                </label>
                                <button
                                    onClick={() => copyToClipboard(credentialsText, 'credentials')}
                                    className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                                >
                                    {copied === 'credentials' ? <Check size={16} /> : <Copy size={16} />}
                                    {copied === 'credentials' ? '복사됨!' : '복사'}
                                </button>
                            </div>
                            <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
                                <p>아이디: <strong>{generatedSQL.credentials.username}</strong></p>
                                <p>비밀번호: <strong>{generatedSQL.credentials.password}</strong></p>
                            </div>
                        </div>

                        {/* SQL */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">
                                    🗃️ SQL 스크립트
                                </label>
                                <button
                                    onClick={() => copyToClipboard(generatedSQL.sql, 'sql')}
                                    className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                                >
                                    {copied === 'sql' ? <Check size={16} /> : <Copy size={16} />}
                                    {copied === 'sql' ? '복사됨!' : '복사'}
                                </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto p-3 bg-gray-900 text-gray-100 rounded-lg font-mono text-xs">
                                <pre className="whitespace-pre-wrap">{generatedSQL.sql}</pre>
                            </div>
                        </div>

                        {/* 버튼 */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setGeneratedSQL(null)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                다시 만들기
                            </button>
                            <button
                                onClick={onCreated}
                                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                            >
                                완료
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateMemberModal;
