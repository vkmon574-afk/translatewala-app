import React, { useState } from 'react';
import { Owner, PaymentMethod, TeamMember } from '../../types';
import { formatMoney } from '../../lib/formatters';
import { X, CheckCircle, UserCheck } from 'lucide-react';

interface ProcessPayModalProps {
  member: TeamMember | null;
  activeOwner: Owner;
  onClose: () => void;
  onConfirmPayout: (data: {
    employeeId: string;
    amount: number;
    paidByOwner: Owner;
    method: PaymentMethod;
    referenceId?: string;
    notes?: string;
  }) => void;
}

export const ProcessPayModal: React.FC<ProcessPayModalProps> = ({
  member,
  activeOwner,
  onClose,
  onConfirmPayout
}) => {
  if (!member) return null;

  const [amount, setAmount] = useState<number>(member.pendingAmount || member.totalEarned || 1000);
  const [paidByOwner, setPaidByOwner] = useState<Owner>(activeOwner);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [referenceId, setReferenceId] = useState<string>(
    `UPI-${Math.floor(Math.random() * 9000000 + 1000000)}`
  );
  const [notes, setNotes] = useState<string>(`Settlement for project work`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPayout({
      employeeId: member.id,
      amount: Number(amount) || 0,
      paidByOwner,
      method,
      referenceId,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Owner Employee Payout
          </span>
          <h3 className="text-xl font-bold text-slate-900">Process Pay to {member.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{member.role}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Owner Payer Selector (CRITICAL FEATURE) */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Who is paying this employee? (Owner)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaidByOwner('Mohiyuddin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  paidByOwner === 'Mohiyuddin'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-300" />
                <span>Mohiyuddin</span>
              </button>

              <button
                type="button"
                onClick={() => setPaidByOwner('Shafiulla')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  paidByOwner === 'Shafiulla'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Shafiulla</span>
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Amount</label>
              <span className="text-[11px] text-slate-500">
                Pending: <strong className="text-amber-600">{formatMoney(member.pendingAmount)}</strong>
              </span>
            </div>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cash">Cash</option>
              <option value="PayPal">PayPal</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Reference ID / UPI Txn ID */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. UPI-98312001"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. October Arabic document translation fee"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            className="mt-2 w-full py-3 bg-primary hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm Payment by {paidByOwner}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
