import React, { useState } from 'react';
import { AppState, Owner, Transaction } from '../types';
import { formatMoney, getOwnerBadgeClass, getStatusBadgeClass } from '../lib/formatters';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import {
  Search,
  Download,
  Filter,
  UserCheck,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  Plus
} from 'lucide-react';

interface TransactionHistoryViewProps {
  state: AppState;
  onOpenRecordPay: () => void;
  onOpenRecordIncome: () => void;
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (tx: Partial<Transaction>) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  state,
  onOpenRecordPay,
  onOpenRecordIncome,
  onDeleteTransaction,
  onUpdateTransaction,
  onEditTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<
    'All' | 'Paid by Mohiyuddin' | 'Paid by Shafiulla' | 'Income' | 'Employee Payouts' | 'Expenses'
  >('All');

  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  const currency = state.currency;

  // Calculate Owner-Specific Totals
  const mohiyuddinTotal = state.transactions
    .filter((t) => t.type === 'employee_payout' && t.paidByOwner === 'Mohiyuddin')
    .reduce((sum, t) => sum + t.amount, 0);

  const shafiullaTotal = state.transactions
    .filter((t) => t.type === 'employee_payout' && t.paidByOwner === 'Shafiulla')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter transactions
  const filteredTransactions = state.transactions.filter((tx) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      tx.title.toLowerCase().includes(searchLower) ||
      (tx.employeeName && tx.employeeName.toLowerCase().includes(searchLower)) ||
      (tx.clientName && tx.clientName.toLowerCase().includes(searchLower)) ||
      (tx.referenceId && tx.referenceId.toLowerCase().includes(searchLower)) ||
      tx.category.toLowerCase().includes(searchLower) ||
      tx.method.toLowerCase().includes(searchLower);

    let matchesTab = true;
    if (activeTab === 'Paid by Mohiyuddin') {
      matchesTab = tx.paidByOwner === 'Mohiyuddin';
    } else if (activeTab === 'Paid by Shafiulla') {
      matchesTab = tx.paidByOwner === 'Shafiulla';
    } else if (activeTab === 'Income') {
      matchesTab = tx.type === 'income';
    } else if (activeTab === 'Employee Payouts') {
      matchesTab = tx.type === 'employee_payout';
    } else if (activeTab === 'Expenses') {
      matchesTab = tx.type === 'expense';
    }

    return matchesSearch && matchesTab;
  });

  // Export to CSV helper
  const exportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Title',
      'Type',
      'Category',
      'Amount',
      'Paid By Owner',
      'Employee/Client',
      'Status',
      'Payment Method',
      'Reference ID',
      'Notes'
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      `"${t.title}"`,
      t.type,
      t.category,
      t.amount,
      t.paidByOwner || 'N/A',
      `"${t.employeeName || t.clientName || ''}"`,
      t.status,
      t.method,
      t.referenceId || '',
      `"${t.notes || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Translatewala_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transaction History Dashboard
          </h2>
          <p className="text-xs text-slate-500">
            Comprehensive audit log & owner payout records for Mohiyuddin & Shafiulla
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenRecordIncome}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Owner Contribution Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mohiyuddin Summary Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1.5 text-blue-100 text-xs font-medium mb-1">
              <UserCheck className="w-4 h-4 text-blue-200" />
              <span>Paid by Mohiyuddin</span>
            </div>
            <p className="text-2xl font-extrabold tracking-tight">
              {formatMoney(mohiyuddinTotal, currency)}
            </p>
            <p className="text-[10px] text-blue-100 mt-1">
              {state.transactions.filter((t) => t.paidByOwner === 'Mohiyuddin').length} logged payouts
            </p>
          </div>
          <button
            onClick={() => setActiveTab('Paid by Mohiyuddin')}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-xs transition-all"
          >
            Filter
          </button>
        </div>

        {/* Shafiulla Summary Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-medium mb-1">
              <UserCheck className="w-4 h-4 text-emerald-200" />
              <span>Paid by Shafiulla</span>
            </div>
            <p className="text-2xl font-extrabold tracking-tight">
              {formatMoney(shafiullaTotal, currency)}
            </p>
            <p className="text-[10px] text-emerald-100 mt-1">
              {state.transactions.filter((t) => t.paidByOwner === 'Shafiulla').length} logged payouts
            </p>
          </div>
          <button
            onClick={() => setActiveTab('Paid by Shafiulla')}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-xs transition-all"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white rounded-full border border-slate-200 shadow-2xs h-11 flex items-center px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by payee, client, Ref ID, category..."
          className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
        />
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 snap-x">
        {(
          [
            'All',
            'Paid by Mohiyuddin',
            'Paid by Shafiulla',
            'Income',
            'Employee Payouts',
            'Expenses'
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`snap-start px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-100">
            No transaction records match your filter criteria.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isPayout = tx.type === 'employee_payout';
            const isIncome = tx.type === 'income';
            const statusBadge = getStatusBadgeClass(tx.status);

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2 hover:border-slate-200 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-700'
                          : isPayout
                          ? 'bg-blue-50 text-primary'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isPayout ? (
                        <UserCheck className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{tx.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tx.date} • {tx.method}{' '}
                        {tx.referenceId ? `• Ref: ${tx.referenceId}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-start gap-2">
                    <div>
                      <p
                        className={`text-base font-extrabold ${
                          isIncome ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatMoney(tx.amount, currency)}
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
                          className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all flex items-center justify-end gap-1 cursor-pointer shadow-2xs group"
                          title="Click to edit payment or mark paid"
                        >
                          <span>Pending</span>
                          <span className="text-[9px] text-amber-900 font-extrabold underline">
                            (Edit)
                          </span>
                        </button>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${statusBadge}`}
                        >
                          {tx.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onEditTransaction && (
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteTransaction && (
                        <button
                          onClick={() => setDeletingTxId(tx.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explicit Owner Payer Mention */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {tx.category}
                    </span>

                    {tx.paidByOwner ? (
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1 ${
                          tx.paidByOwner === 'Mohiyuddin'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Paid by {tx.paidByOwner}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Direct Agency Record</span>
                    )}
                  </div>

                  {tx.notes && <p className="text-[11px] text-slate-600 italic">{tx.notes}</p>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTxId && onDeleteTransaction && (
        <DeleteConfirmModal
          title="Delete Transaction Entry?"
          description="Are you sure you want to delete this transaction record? This action will sync across all connected owner devices."
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
