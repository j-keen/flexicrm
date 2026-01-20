import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Building2, UserPlus, RefreshCw } from 'lucide-react';
import type { Team, UserProfile } from '../../types';
import {
    fetchTeams,
    fetchMembers,
    createTeam,
    updateMemberTeam,
} from '../../services/supabase';
import { TeamCard } from './TeamCard';
import { MemberCard } from './MemberCard';
import { CreateTeamModal } from './CreateTeamModal';
import { CreateMemberModal } from './CreateMemberModal';
import { MemberDetailModal } from './MemberDetailModal';

export const TeamMemberManagement: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showCreateMember, setShowCreateMember] = useState(false);
    const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
    const [createMemberForTeam, setCreateMemberForTeam] = useState<string | undefined>();

    const loadData = useCallback(async () => {
        setLoading(true);
        const [teamsData, membersData] = await Promise.all([
            fetchTeams(),
            fetchMembers(),
        ]);
        setTeams(teamsData);
        setMembers(membersData);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 팀별 멤버 그룹화
    const getMembersByTeam = (teamId: string) =>
        members.filter((m) => m.team_id === teamId && m.is_active);

    // 미배정 멤버
    const unassignedMembers = members.filter(
        (m) => !m.team_id && m.is_active
    );

    // 팀 생성 완료 핸들러
    const handleTeamCreated = async (name: string, leadId?: string) => {
        const newTeam = await createTeam(name, leadId);
        if (newTeam) {
            setTeams([...teams, newTeam]);
        }
        setShowCreateTeam(false);
    };

    // 멤버 팀 배정 핸들러
    const handleAssignToTeam = async (userId: string, teamId: string | null) => {
        const success = await updateMemberTeam(userId, teamId);
        if (success) {
            setMembers(
                members.map((m) =>
                    m.id === userId ? { ...m, team_id: teamId } : m
                )
            );
        }
    };

    // 멤버 추가 버튼 (팀 카드에서)
    const handleAddMemberToTeam = (teamId: string) => {
        setCreateMemberForTeam(teamId);
        setShowCreateMember(true);
    };

    // 멤버 생성 완료 핸들러
    const handleMemberCreated = () => {
        setShowCreateMember(false);
        setCreateMemberForTeam(undefined);
        loadData(); // 새로고침
    };

    // 멤버 수정 완료 핸들러
    const handleMemberUpdated = () => {
        setSelectedMember(null);
        loadData(); // 새로고침
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 rounded-lg">
                        <Users className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">팀 & 멤버 관리</h1>
                        <p className="text-sm text-gray-500">
                            팀 구성과 멤버 계정을 관리합니다
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateMember(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <UserPlus size={18} />
                        멤버 추가
                    </button>
                    <button
                        onClick={() => setShowCreateTeam(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                    >
                        <Plus size={18} />
                        팀 추가
                    </button>
                </div>
            </div>

            {/* 팀 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {teams.map((team) => (
                    <TeamCard
                        key={team.id}
                        team={team}
                        members={getMembersByTeam(team.id)}
                        allMembers={members}
                        onMemberClick={setSelectedMember}
                        onAddMember={() => handleAddMemberToTeam(team.id)}
                        onAssignMember={(userId) => handleAssignToTeam(userId, team.id)}
                        onRefresh={loadData}
                    />
                ))}

                {/* 팀 추가 카드 */}
                <button
                    onClick={() => setShowCreateTeam(true)}
                    className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-colors group"
                >
                    <div className="p-3 bg-gray-100 rounded-full group-hover:bg-brand-100 transition-colors">
                        <Building2 className="w-6 h-6 text-gray-400 group-hover:text-brand-600" />
                    </div>
                    <span className="mt-2 text-sm font-medium text-gray-500 group-hover:text-brand-600">
                        팀 추가
                    </span>
                </button>
            </div>

            {/* 미배정 멤버 영역 */}
            {unassignedMembers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-amber-600" />
                        <h2 className="font-semibold text-amber-800">
                            미배정 멤버 ({unassignedMembers.length}명)
                        </h2>
                        <span className="text-sm text-amber-600">
                            — 팀에 배정해주세요
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {unassignedMembers.map((member) => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                compact
                                onClick={() => setSelectedMember(member)}
                                teams={teams}
                                onAssignToTeam={(teamId) => handleAssignToTeam(member.id, teamId)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 모달들 */}
            {showCreateTeam && (
                <CreateTeamModal
                    members={members}
                    onClose={() => setShowCreateTeam(false)}
                    onCreate={handleTeamCreated}
                />
            )}

            {showCreateMember && (
                <CreateMemberModal
                    teams={teams}
                    defaultTeamId={createMemberForTeam}
                    onClose={() => {
                        setShowCreateMember(false);
                        setCreateMemberForTeam(undefined);
                    }}
                    onCreated={handleMemberCreated}
                />
            )}

            {selectedMember && (
                <MemberDetailModal
                    member={selectedMember}
                    teams={teams}
                    onClose={() => setSelectedMember(null)}
                    onUpdated={handleMemberUpdated}
                />
            )}
        </div>
    );
};

export default TeamMemberManagement;
