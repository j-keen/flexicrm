import React, { useState } from 'react';
import {
    Building2,
    UserPlus,
    MoreVertical,
    Edit2,
    Trash2,
    Crown,
} from 'lucide-react';
import type { Team, UserProfile } from '../../types';
import { MemberCard } from './MemberCard';
import { deleteTeam, updateTeam } from '../../services/supabase';

interface TeamCardProps {
    team: Team;
    members: UserProfile[];
    allMembers: UserProfile[];
    onMemberClick: (member: UserProfile) => void;
    onAddMember: () => void;
    onAssignMember: (userId: string) => void;
    onRefresh: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
    team,
    members,
    allMembers,
    onMemberClick,
    onAddMember,
    onRefresh,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(team.name);

    const teamLead = allMembers.find((m) => m.id === team.lead_id);

    const handleDelete = async () => {
        if (confirm(`"${team.name}" 팀을 삭제하시겠습니까? 소속 멤버들은 미배정 상태가 됩니다.`)) {
            await deleteTeam(team.id);
            onRefresh();
        }
        setShowMenu(false);
    };

    const handleRename = async () => {
        if (editName.trim() && editName !== team.name) {
            await updateTeam(team.id, { name: editName.trim() });
            onRefresh();
        }
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 bg-gradient-to-r from-brand-50 to-blue-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-brand-600" />
                        {isEditing ? (
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="px-2 py-1 border rounded text-lg font-semibold"
                                autoFocus
                            />
                        ) : (
                            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 hover:bg-white/50 rounded"
                        >
                            <MoreVertical size={18} className="text-gray-500" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[120px]">
                                <button
                                    onClick={() => {
                                        setIsEditing(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit2 size={14} />
                                    이름 변경
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {/* 팀 리더 */}
                {teamLead && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-brand-700">
                        <Crown size={14} />
                        <span>팀장: {teamLead.full_name}</span>
                    </div>
                )}
            </div>

            {/* 멤버 리스트 */}
            <div className="p-3 space-y-2 min-h-[100px]">
                {members.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                        팀원이 없습니다
                    </p>
                ) : (
                    members.map((member) => (
                        <MemberCard
                            key={member.id}
                            member={member}
                            onClick={() => onMemberClick(member)}
                            isTeamLead={member.id === team.lead_id}
                        />
                    ))
                )}
            </div>

            {/* 멤버 추가 버튼 */}
            <div className="px-3 pb-3">
                <button
                    onClick={onAddMember}
                    className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors flex items-center justify-center gap-1"
                >
                    <UserPlus size={16} />
                    멤버 추가
                </button>
            </div>
        </div>
    );
};

export default TeamCard;
