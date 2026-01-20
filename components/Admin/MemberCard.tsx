import React, { useState } from 'react';
import { User, Crown, ChevronDown, Shield } from 'lucide-react';
import type { UserProfile, Team, UserRole } from '../../types';

interface MemberCardProps {
    member: UserProfile;
    onClick?: () => void;
    isTeamLead?: boolean;
    compact?: boolean;
    teams?: Team[];
    onAssignToTeam?: (teamId: string | null) => void;
}

const roleLabels: Record<UserRole, { label: string; color: string }> = {
    ceo: { label: 'CEO', color: 'bg-purple-100 text-purple-700' },
    team_lead: { label: '팀장', color: 'bg-blue-100 text-blue-700' },
    staff: { label: '사원', color: 'bg-gray-100 text-gray-700' },
};

export const MemberCard: React.FC<MemberCardProps> = ({
    member,
    onClick,
    isTeamLead,
    compact,
    teams,
    onAssignToTeam,
}) => {
    const [showTeamSelector, setShowTeamSelector] = useState(false);
    const roleInfo = roleLabels[member.role];

    if (compact) {
        return (
            <div className="relative inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-amber-200 shadow-sm">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-amber-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${roleInfo.color}`}>
                        {roleInfo.label}
                    </span>
                </div>
                {teams && onAssignToTeam && (
                    <div className="relative ml-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTeamSelector(!showTeamSelector);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <ChevronDown size={16} />
                        </button>
                        {showTeamSelector && (
                            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-20 min-w-[150px]">
                                {teams.map((team) => (
                                    <button
                                        key={team.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAssignToTeam(team.id);
                                            setShowTeamSelector(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                        {team.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {onClick && (
                    <button
                        onClick={onClick}
                        className="ml-1 p-1 hover:bg-gray-100 rounded"
                    >
                        <Shield size={14} className="text-gray-400" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
                {isTeamLead ? (
                    <Crown size={18} className="text-brand-600" />
                ) : (
                    <User size={18} className="text-brand-600" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                    {member.full_name}
                </p>
                <div className="flex items-center gap-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${roleInfo.color}`}>
                        {roleInfo.label}
                    </span>
                    {isTeamLead && (
                        <span className="text-xs text-brand-600">팀장</span>
                    )}
                </div>
            </div>
        </button>
    );
};

export default MemberCard;
