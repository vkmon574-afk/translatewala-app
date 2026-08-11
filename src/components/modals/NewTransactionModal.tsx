import React, { useState } from 'react';
import { Owner, PaymentMethod, PaymentStatus, Transaction, TransactionCategory } from '../../types';
import { X, CheckCircle, Plus, Edit2 } from 'lucide-react';

interface NewTransactionModalProps {
  activeOwner: Owner;
  defaultType?: 'income' | 'expense' | 'employee_payout';
  initialTransaction?: Transaction | null;
  onClose: () => void;
  onRecord: (tx: {
    id?: string;
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'employee_payout';
    category: TransactionCategory;
    status: PaymentStatus;
    method: PaymentMethod;
    paidByOwner?: Owner;
    clientName?: string;
    employeeName?: string;
    notes?: string;
    referenceId?: string;
    date: string;
  }) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  activeOwner,
  defaultType = 'income',
  initialTransaction,
  onClose,
  onRecord
}) => {
  const [type, setType] = useState<'income' | 'expense' | 'employee_payout'>(
    initialTransaction?.type || defaultType
  );
  const [title, setTitle] = useState(initialTransaction?.title || '');
  const [amount, setAmount] = useState<number | ''>(
    initialTransaction ? initialTransaction.amount : ''
  );
  const [category, setCategory] = useState<TransactionCategory>(
    initialTransaction?.category || (defaultType === 'income' ? 'Income' : 'Operating Cost')
  );
  const [status, setStatus] = useState<PaymentStatus>(
    initialTransaction?.status || 'Paid'
  );
  const [method, setMethod] = useState<PaymentMethod>(
    initialTransaction?.method || 'Bank Transfer'
  );
  const [paidByOwner, setPaidByOwner] = useState<Owner>(
    initialTransaction?.paidByOwner || activeOwner
  );
  const [clientName, setClientName] = useState(initialTransaction?.clientName || '');
  const [employeeName, setEmployeeName] = useState(initialTransaction?.employeeName || '');
  const [notes, setNotes] = useState(initialTransaction?.notes || '');
  const [date, setDate] = useState(
    initialTransaction?.date || new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    onRecord({
      id: initialTransaction?.id,
      title,
      amount: Number(amount),
      type,
      category,
      status,
      method,
      paidByOwner: type === 'employee_payout' ? paidByOwner : undefined,
      clientName: type === 'income' ? clientName : undefined,
      employeeName: type === 'employee_payout' ? employeeName : undefined,
      notes,
      referenceId: initialTransaction?.referenceId || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
      date
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Financial Ledger
          </span>
          <h3 className="text-xl font-bold text-slate-900">
            {initialTransaction
              ? 'Edit Transaction / Payment'
              : `Record ${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Employee Payout'}`}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Type selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Income');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                type === 'income' ? 'bg-white text-primary shadow-xs' : 'text-slate-600'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Operating Cost');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                type === 'expense' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('employee_payout');
                setCategory('Employee Payout');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                type === 'employee_payout' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Owner Payout
            </button>
          </div>

          {/* Owner Selector if employee payout */}
          {type === 'employee_payout' && (
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Paid By Owner
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaidByOwner('Mohiyuddin')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    paidByOwner === 'Mohiyuddin'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Mohiyuddin
                </button>
                <button
                  type="button"
                  onClick={() => setPaidByOwner('Shafiulla')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    paidByOwner === 'Shafiulla'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Shafiulla
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Title / Description</label>
            <input
              type="text"
              required
              placeholder={
                type === 'income'
                  ? 'e.g. Dubai Tech Website Translation'
                  : type === 'expense'
                  ? 'e.g. AWS Monthly Cloud Subscription'
                  : 'e.g. Rajesh Kumar Hindi Project Settlement'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Amount</label>
            <input
              type="number"
              required
              min={1}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-base font-bold text-slate-900 outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Client or Employee name if applicable */}
          {type === 'income' ? (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Client Name</label>
              <input
                type="text"
                placeholder="e.g. Qatar Media Group"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
          ) : type === 'employee_payout' ? (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Employee / Payee Name</label>
              <input
                type="text"
                placeholder="e.g. Shakurullah"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
          ) : null}

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              >
                {type === 'income' ? (
                  <option value="Income">Income</option>
                ) : (
                  <>
                    <option value="Employee Payout">Employee Payout</option>
                    <option value="Freelancer Fee">Freelancer Fee</option>
                    <option value="Operating Cost">Operating Cost</option>
                    <option value="Software">Software</option>
                    <option value="Office Rent">Office Rent</option>
                    <option value="Marketing">Marketing</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Cleared">Cleared</option>
              </select>
            </div>
          </div>

          {/* Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="PayPal">PayPal</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 w-full py-3 bg-primary hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {initialTransaction ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{initialTransaction ? 'Update Entry' : 'Save Entry'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
