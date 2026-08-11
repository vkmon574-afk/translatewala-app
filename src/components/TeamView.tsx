import React, { useState } from 'react';
import { AppState, TeamMember } from '../types';
import { formatMoney } from '../lib/formatters';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import {
  User,
  Mail,
  MessageCircle,
  ArrowRight,
  Plus,
  MoreVertical,
  CheckCircle,
  Clock,
  ShieldCheck,
  Trash2,
  Edit2
} from 'lucide-react';

interface TeamViewProps {
  state: AppState;
  onOpenProcessPay: (member: TeamMember) => void;
  onOpenAddMember: () => void;
  onEditMember?: (member: TeamMember) => void;
  onDeleteMember?: (id: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  state,
  onOpenProcessPay,
  onOpenAddMember,
  onEditMember,
  onDeleteMember
}) => {
  const [filterType, setFilterType] = useState<
    'All Members' | 'Employees' | 'Freelancers' | 'Pending Pay'
  >('All Members');

  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const currency = state.currency;

  const filteredTeam = state.team.filter((member) => {
    if (filterType === 'Employees') return member.type === 'Employee';
    if (filterType === 'Freelancers') return member.type === 'Freelancer';
    if (filterType === 'Pending Pay') return member.pendingAmount > 0;
    return true;
  });

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Team Overview</h2>
        <p className="text-xs text-slate-500">
          Manage your translators, view performance, and log owner payments.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 snap-x">
        {(['All Members', 'Employees', 'Freelancers', 'Pending Pay'] as const).map((chip) => {
          const isActive = filterType === chip;
          return (
            <button
              key={chip}
              onClick={() => setFilterType(chip)}
              className={`snap-start px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Team Cards List */}
      <div className="flex flex-col gap-4">
        {filteredTeam.map((member) => {
          const isOwner = member.name === 'Mohiyuddin' || member.name === 'Shafiulla';
          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-all"
            >
              {/* Top Header info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shadow-2xs">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    )}
                    {isOwner && (
                      <span
                        className="absolute -bottom-1 -right-1 bg-primary text-white text-[9px] p-0.5 rounded-full border-2 border-white"
                        title="Co-Owner / Administrator"
                      >
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-slate-900">{member.name}</h3>
                      {isOwner && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {onEditMember && (
                    <button
                      onClick={() => onEditMember(member)}
                      className="text-slate-300 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-all"
                      title="Edit Member"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteMember && !isOwner && (
                    <button
                      onClick={() => setDeletingMemberId(member.id)}
                      className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                      title="Delete Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-2 text-xs">
                <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Projects (Mo)
                  </span>
                  <span className="text-lg font-bold text-slate-900">{member.projectsCount}</span>
                </div>

                <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total Earned
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatMoney(member.totalEarned, currency)}
                  </span>
                </div>

                <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Paid
                  </span>
                  <span className="text-base font-bold text-emerald-600">
                    {formatMoney(member.paidAmount, currency)}
                  </span>
                </div>

                <div
                  className={`flex flex-col p-2 rounded-lg border ${
                    member.pendingAmount > 0
                      ? 'bg-rose-50 border-rose-100 text-rose-900'
                      : 'bg-white border-slate-100 text-slate-600'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                    Pending
                  </span>
                  <span className="text-base font-bold">
                    {formatMoney(member.pendingAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex flex-col text-xs">
                  <span className="text-[10px] text-slate-400 font-medium">Last Paid</span>
                  <span className="text-slate-700 font-semibold">
                    {member.lastPaidDate || 'N/A'}{' '}
                    {member.lastPaidBy && (
                      <span className="text-[10px] font-normal text-slate-500">
                        (by {member.lastPaidBy})
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${member.email || ''}`}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-primary transition-colors"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>

                  <a
                    href={`https://wa.me/${member.phone?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                    title="WhatsApp Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onOpenProcessPay(member)}
                    className="px-3.5 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>Process Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Team Member button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onOpenAddMember}
          className="px-6 py-3 bg-white border border-slate-200 text-primary hover:bg-slate-50 rounded-full font-semibold text-xs shadow-xs transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMemberId && onDeleteMember && (
        <DeleteConfirmModal
          title="Remove Team Member?"
          description="Are you sure you want to remove this team member? Their history will remain in past transaction logs."
          onClose={() => setDeletingMemberId(null)}
          onConfirm={() => {
            onDeleteMember(deletingMemberId);
            setDeletingMemberId(null);
          }}
        />
      )}
    </div>
  );
};
