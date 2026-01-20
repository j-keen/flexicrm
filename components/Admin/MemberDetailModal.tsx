import React, { useState, useEffect } from 'react';
import { X, User, Shield, Save, UserX, UserCheck } from 'lucide-react';
import type { UserProfile, Team, UserRole, PermissionOverride } from '../../types';
import { PERMISSIONS } from '../../types';
import {
    updateMember,
    deactivateMember,
    activateMember,
    getPermissionOverrides,
    setPermissionOverride,
    removePermissionOverride,
    fetchAllPermissions,
    PermissionDef,
} from '../../services/supabase';

interface MemberDetailModalProps {
    member: UserProfile;
    teams: Team[];
    onClose: () => void;
    onUpdated: () => void;
}

const roleLabels: Record<UserRole, string> = {
    ceo: 'CEO',
    team_lead: '팀장',
    staff: '사원',
};

// 권한 카테고리 한글
const categoryLabels: Record<string, string> = {
    schema: '스키마',
    data: '데이터',
    admin: '관리',
    feature: '기능',
};

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
    member,
    teams,
    onClose,
    onUpdated,
}) => {
    const [fullName, setFullName] = useState(member.full_name);
    const [role, setRole] = useState<UserRole>(member.role);
    const [teamId, setTeamId] = useState(member.team_id || '');
    const [permissions, setPermissions] = useState<PermissionDef[]>([]);
    const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 권한 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [perms, ovr] = await Promise.all([
                fetchAllPermissions(),
                getPermissionOverrides(member.id),
            ]);
            setPermissions(perms);
            setOverrides(ovr);

            // 역할 기반 기본 권한 (정적 정의 - 실제로는 DB에서 가져와야 함)
            const rolePerm = new Set<string>();
            if (role === 'ceo') {
                Object.values(PERMISSIONS).forEach((p) => rolePerm.add(p));
            } else if (role === 'team_lead') {
                [
                    PERMISSIONS.SCHEMA_FIELDS_READ,
                    PERMISSIONS.SCHEMA_AUTOMATION_READ,
                    PERMISSIONS.DATA_CUSTOMERS_READ_ALL,
                    PERMISSIONS.DATA_CUSTOMERS_READ_TEAM,
                    PERMISSIONS.DATA_CUSTOMERS_READ_OWN,
                    PERMISSIONS.DATA_CUSTOMERS_CREATE,
                    PERMISSIONS.DATA_CUSTOMERS_UPDATE_TEAM,
                    PERMISSIONS.DATA_CUSTOMERS_UPDATE_OWN,
                    PERMISSIONS.DATA_CUSTOMERS_EXPORT,
                    PERMISSIONS.ADMIN_USERS_READ,
                    PERMISSIONS.ADMIN_AUDIT_READ,
                    PERMISSIONS.FEATURE_REPORTS_VIEW,
                ].forEach((p) => rolePerm.add(p));
            } else {
                [
                    PERMISSIONS.SCHEMA_FIELDS_READ,
                    PERMISSIONS.DATA_CUSTOMERS_READ_OWN,
                    PERMISSIONS.DATA_CUSTOMERS_CREATE,
                    PERMISSIONS.DATA_CUSTOMERS_UPDATE_OWN,
                    PERMISSIONS.FEATURE_REPORTS_VIEW,
                ].forEach((p) => rolePerm.add(p));
            }
            setRolePermissions(rolePerm);
            setLoading(false);
        };
        loadData();
    }, [member.id, role]);

    // 권한 상태 계산
    const getPermissionState = (permId: string): 'granted' | 'denied' | 'default' => {
        const override = overrides.find((o) => o.permission_id === permId);
        if (override) {
            return override.granted ? 'granted' : 'denied';
        }
        return 'default';
    };

    // 실제 권한 여부
    const hasPermission = (permId: string): boolean => {
        const override = overrides.find((o) => o.permission_id === permId);
        if (override) return override.granted;
        return rolePermissions.has(permId);
    };

    // 권한 토글
    const handlePermissionToggle = async (permId: string) => {
        const currentState = getPermissionState(permId);
        const baseHas = rolePermissions.has(permId);

        if (currentState === 'default') {
            // 기본 → 반대로 오버라이드
            await setPermissionOverride(member.id, permId, !baseHas);
            setOverrides([...overrides, { user_id: member.id, permission_id: permId, granted: !baseHas, granted_by: null, created_at: '' }]);
        } else {
            // 오버라이드 제거 (기본으로 복귀)
            await removePermissionOverride(member.id, permId);
            setOverrides(overrides.filter((o) => o.permission_id !== permId));
        }
    };

    // 기본 정보 저장
    const handleSave = async () => {
        setSaving(true);
        await updateMember(member.id, {
            full_name: fullName.trim(),
            role,
            team_id: teamId || null,
        });
        setSaving(false);
        onUpdated();
    };

    // 비활성화/활성화
    const handleToggleActive = async () => {
        if (member.is_active) {
            if (confirm(`"${member.full_name}" 계정을 비활성화하시겠습니까?`)) {
                await deactivateMember(member.id);
                onUpdated();
            }
        } else {
            await activateMember(member.id);
            onUpdated();
        }
    };

    // 권한을 카테고리별로 그룹화
    const permissionsByCategory = permissions.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
    }, {} as Record<string, PermissionDef[]>);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${member.is_active ? 'bg-brand-100' : 'bg-gray-100'}`}>
                            <User className={`w-5 h-5 ${member.is_active ? 'text-brand-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{member.full_name}</h2>
                            <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleActive}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${member.is_active
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                        >
                            {member.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                            {member.is_active ? '비활성화' : '활성화'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* 컨텐츠 */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* 기본 정보 */}
                    <section>
                        <h3 className="font-medium text-gray-900 mb-3">기본 정보</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">역할</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500"
                                >
                                    {Object.entries(roleLabels).map(([r, label]) => (
                                        <option key={r} value={r}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">소속 팀</label>
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="">미배정</option>
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* 권한 설정 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-brand-600" />
                            <h3 className="font-medium text-gray-900">세부 권한 설정</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            역할 기반 기본 권한에 개별 오버라이드를 적용할 수 있습니다.
                            <br />
                            <span className="text-green-600">●</span> 추가 부여 |
                            <span className="text-red-600"> ●</span> 명시적 거부 |
                            <span className="text-gray-400"> ○</span> 역할 기본값
                        </p>

                        {loading ? (
                            <p className="text-gray-500 text-center py-4">권한 로딩 중...</p>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                    <div key={category} className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2 font-medium text-sm text-gray-700">
                                            {categoryLabels[category] || category}
                                        </div>
                                        <div className="divide-y">
                                            {perms.map((perm) => {
                                                const state = getPermissionState(perm.id);
                                                const active = hasPermission(perm.id);
                                                return (
                                                    <div
                                                        key={perm.id}
                                                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                                                            {perm.description && (
                                                                <p className="text-xs text-gray-500">{perm.description}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handlePermissionToggle(perm.id)}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${state === 'granted'
                                                                    ? 'bg-green-500 text-white'
                                                                    : state === 'denied'
                                                                        ? 'bg-red-500 text-white'
                                                                        : active
                                                                            ? 'bg-gray-200 text-gray-600'
                                                                            : 'bg-gray-100 text-gray-400'
                                                                }`}
                                                        >
                                                            {state === 'default' ? (active ? '✓' : '✗') : state === 'granted' ? '✓' : '✗'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* 푸터 */}
                <div className="flex justify-end gap-2 p-5 border-t flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                        <Save size={18} />
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberDetailModal;
