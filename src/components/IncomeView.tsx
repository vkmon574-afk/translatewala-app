import React, { useState } from 'react';
import { AppState, Transaction } from '../types';
import { formatMoney, getStatusBadgeClass } from '../lib/formatters';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import {
  TrendingUp,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  DollarSign,
  Wallet,
  Trash2,
  Edit2
} from 'lucide-react';

interface IncomeViewProps {
  state: AppState;
  onOpenRecordIncome: () => void;
  onNavigateTransactions: () => void;
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (tx: Partial<Transaction>) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  state,
  onOpenRecordIncome,
  onNavigateTransactions,
  onDeleteTransaction,
  onUpdateTransaction,
  onEditTransaction
}) => {
  const [activeMonth, setActiveMonth] = useState<'this_month' | 'last_month'>('this_month');
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const currency = state.currency;

  const incomeTransactions = state.transactions.filter((t) => t.type === 'income');

  const receivedTotal = incomeTransactions
    .filter((t) => t.status === 'Paid' || t.status === 'Cleared')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTotal = incomeTransactions
    .filter((t) => t.status === 'Pending' || t.status === 'Overdue')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInvoiced = receivedTotal + pendingTotal;

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Header & Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Income</h2>
        <div className="flex gap-2">
          <button
            onClick={onNavigateTransactions}
            className="p-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title="Filter and Search All Income Transactions"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenRecordIncome}
            className="bg-primary hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* Monthly Toggle Pill */}
      <div className="bg-slate-100 rounded-full p-1 flex relative border border-slate-200">
        <button
          onClick={() => setActiveMonth('this_month')}
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all text-center ${
            activeMonth === 'this_month'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setActiveMonth('last_month')}
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all text-center ${
            activeMonth === 'last_month'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Last Month
        </button>
      </div>

      {/* Financial Overview Cards (Bento Style) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="col-span-2 bg-gradient-to-br from-blue-600 to-primary text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">
            Total Invoiced
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {formatMoney(totalInvoiced, currency)}
          </p>
          <div className="flex items-center gap-1 mt-3 text-emerald-300 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>+15% from last month</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Received</span>
          </p>
          <p className="text-xl font-bold text-slate-900">
            {formatMoney(receivedTotal, currency)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending</span>
          </p>
          <p className="text-xl font-bold text-amber-700">
            {formatMoney(pendingTotal, currency)}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
            Recent Transactions
          </h3>
          <button
            onClick={onNavigateTransactions}
            className="text-xs font-bold text-primary hover:underline"
          >
            View All
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {incomeTransactions.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-slate-100">
              No income entries recorded yet.
            </div>
          ) : (
            incomeTransactions.slice(0, 8).map((tx) => {
              const statusBadge = getStatusBadgeClass(tx.status);
              return (
                <div
                  key={tx.id}
                  className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-2xs border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                      <p className="text-xs text-slate-500">
                        {tx.date} • {tx.method} {tx.clientName ? `• ${tx.clientName}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        +{formatMoney(tx.amount, currency)}
                      </p>
                      {tx.status === 'Pending' ? (
                        <button
                          onClick={() => {
                            if (onEditTransaction) {
                              onEditTransaction(tx);
                            } else if (onUpdateTransaction) {
                              onUpdateTransaction({ id: tx.id, status: 'Paid' });
                            }
                          }}
                          className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all flex items-center justify-end gap-1 cursor-pointer group"
                          title="Click to edit payment or mark paid"
                        >
                          <span>Pending</span>
                          <span className="text-[9px] font-extrabold underline text-amber-900">
                            (Edit)
                          </span>
                        </button>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] mt-1 ${statusBadge}`}
                        >
                          {tx.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onEditTransaction && (
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-lg transition-all"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteTransaction && (
                        <button
                          onClick={() => setDeletingTxId(tx.id)}
                          className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTxId && onDeleteTransaction && (
        <DeleteConfirmModal
          title="Delete Income Record?"
          description="Are you sure you want to delete this income entry?"
          onClose={() => setDeletingTxId(null)}
          onConfirm={() => {
            onDeleteTransaction(deletingTxId);
            setDeletingTxId(null);
          }}
        />
      )}
    </div>
  );
};
