import React, { useState } from 'react';
import { AppState } from '../types';
import { formatMoney, getStatusBadgeClass } from '../lib/formatters';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import {
  CreditCard,
  Plus,
  Users,
  Building,
  ArrowDownRight,
  UserCheck,
  Trash2
} from 'lucide-react';

interface ExpensesViewProps {
  state: AppState;
  onOpenNewExpense: () => void;
  onNavigateTransactions: () => void;
  onDeleteTransaction?: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  state,
  onOpenNewExpense,
  onNavigateTransactions,
  onDeleteTransaction
}) => {
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const currency = state.currency;

  const expenseTransactions = state.transactions.filter(
    (t) => t.type === 'expense' || t.type === 'employee_payout'
  );

  const freelancerPayouts = expenseTransactions
    .filter((t) => t.type === 'employee_payout')
    .reduce((sum, t) => sum + t.amount, 0);

  const operatingCosts = expenseTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthTotal = freelancerPayouts + operatingCosts;

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Header & Action */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Overview</h2>
        </div>
        <button
          onClick={onOpenNewExpense}
          className="bg-primary hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Expense</span>
        </button>
      </div>

      {/* Main KPI Card */}
      <div className="bg-gradient-to-br from-slate-100 to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-xs">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          This Month's Total Expenses
        </p>
        <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {formatMoney(monthTotal, currency)}
        </p>
        <div className="flex items-center gap-1 mt-3 text-rose-600 text-xs font-semibold">
          <ArrowDownRight className="w-4 h-4" />
          <span>+12% from last month</span>
        </div>
      </div>

      {/* Expense Categories */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-2">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Freelancer & Staff Payouts
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {formatMoney(freelancerPayouts, currency)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Operating Costs
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {formatMoney(operatingCosts, currency)}
            </p>
          </div>
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
            VIEW ALL
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {expenseTransactions.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-slate-100">
              No expense entries recorded yet.
            </div>
          ) : (
            expenseTransactions.slice(0, 10).map((tx) => {
              const statusBadge = getStatusBadgeClass(tx.status);
              return (
                <div
                  key={tx.id}
                  className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-2xs border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      {tx.type === 'employee_payout' ? (
                        <Users className="w-5 h-5 text-primary" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">
                          {tx.category}
                        </span>
                        <span className="text-xs text-slate-400">{tx.date}</span>
                        {tx.paidByOwner && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              tx.paidByOwner === 'Mohiyuddin'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            By {tx.paidByOwner}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        -{formatMoney(tx.amount, currency)}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] mt-1 ${statusBadge}`}
                      >
                        {tx.status}
                      </span>
                    </div>

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
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTxId && onDeleteTransaction && (
        <DeleteConfirmModal
          title="Delete Expense Record?"
          description="Are you sure you want to delete this expense entry?"
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
