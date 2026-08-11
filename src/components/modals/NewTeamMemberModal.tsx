import React, { useState } from 'react';
import { TeamMember } from '../../types';
import { X, UserPlus, Save } from 'lucide-react';

interface NewTeamMemberModalProps {
  member?: TeamMember | null;
  onClose: () => void;
  onSave: (member: Partial<TeamMember>) => void;
}

export const NewTeamMemberModal: React.FC<NewTeamMemberModalProps> = ({
  member,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(member?.name || '');
  const [role, setRole] = useState(member?.role || 'Senior Arabic Translator');
  const [type, setType] = useState<'Employee' | 'Freelancer'>(member?.type || 'Freelancer');
  const [phone, setPhone] = useState(member?.phone || '');
  const [email, setEmail] = useState(member?.email || '');
  const [upiId, setUpiId] = useState(member?.upiId || '');
  const [totalEarned, setTotalEarned] = useState<number | string>(member?.totalEarned || 0);
  const [paidAmount, setPaidAmount] = useState<number | string>(member?.paidAmount || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const earnedNum = Number(totalEarned) || 0;
    const paidNum = Number(paidAmount) || 0;
    const pendingNum = Math.max(0, earnedNum - paidNum);

    onSave({
      id: member?.id,
      name: name.trim(),
      role: role.trim(),
      type,
      phone: phone.trim(),
      email: email.trim(),
      upiId: upiId.trim(),
      totalEarned: earnedNum,
      paidAmount: paidNum,
      pendingAmount: pendingNum,
      projectsCount: member?.projectsCount || 0
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-700 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">
                {member ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <p className="text-xs text-blue-100">Translator or freelancer details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role/Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead Translator"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              >
                <option value="Employee">Employee</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@translatewala.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (For Payouts)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="rahul@okaxis"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Earned (Aggregate)</label>
              <input
                type="number"
                value={totalEarned}
                onChange={(e) => setTotalEarned(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Already Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{member ? 'Save Changes' : 'Create Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
