import React from 'react';
import { AppState, Owner } from '../types';
import { formatMoney } from '../lib/formatters';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CheckCircle2,
  CreditCard,
  FileText,
  UserCheck,
  FolderPlus
} from 'lucide-react';

interface DashboardViewProps {
  state: AppState;
  onOpenNewInvoice: () => void;
  onOpenRecordPay: () => void;
  onOpenAddClient?: () => void;
  onOpenAddProject?: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onOpenNewInvoice,
  onOpenRecordPay,
  onOpenAddClient,
  onOpenAddProject,
  onNavigateTab
}) => {
  const currency = state.currency;

  // Dynamically compute Top Clients from projects and transactions
  const clientMap: Record<string, { name: string; total: number; projectsCount: number }> = {};

  // First seed from state.clients if present
  if (state.clients) {
    state.clients.forEach((c) => {
      clientMap[c.name.toLowerCase()] = {
        name: c.name,
        total: c.totalBusinessVolume || 0,
        projectsCount: c.totalProjectsCount || 0
      };
    });
  }

  // Aggregate project charges by client
  state.projects.forEach((p) => {
    const key = p.clientName.toLowerCase();
    if (!clientMap[key]) {
      clientMap[key] = { name: p.clientName, total: 0, projectsCount: 0 };
    }
    clientMap[key].total += p.clientCharge;
    clientMap[key].projectsCount += 1;
  });

  const topClients = Object.values(clientMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  // Calculate metrics
  const totalIncome = state.transactions
    .filter((t) => t.type === 'income' && (t.status === 'Paid' || t.status === 'Cleared'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = state.transactions
    .filter((t) => t.type === 'expense' || t.type === 'employee_payout')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  const pendingReceivables = state.transactions
    .filter((t) => t.type === 'income' && (t.status === 'Pending' || t.status === 'Overdue'))
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPayouts = state.team.reduce((sum, m) => sum + m.pendingAmount, 0);

  // Owner Payout Totals
  const mohiyuddinPaid = state.transactions
    .filter((t) => t.type === 'employee_payout' && t.paidByOwner === 'Mohiyuddin')
    .reduce((sum, t) => sum + t.amount, 0);

  const shafiullaPaid = state.transactions
    .filter((t) => t.type === 'employee_payout' && t.paidByOwner === 'Shafiulla')
    .reduce((sum, t) => sum + t.amount, 0);

  // Helper to parse dates reliably from "YYYY-MM-DD" or ISO strings
  const parseTxDate = (dateStr?: string): { year: number; month: number } | null => {
    if (!dateStr) return null;
    const cleanStr = dateStr.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed month
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m };
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    return null;
  };

  // Compute live rolling 6 months based on the current date
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const liveMonthlyStats = Array.from({ length: 6 }).map((_, idx) => {
    // 5 months ago up to the current active month (idx 0 to 5)
    const targetDate = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const isCurrentMonth = idx === 5;

    // Aggregate paid income for this specific month & year
    const monthIncome = state.transactions
      .filter((t) => {
        if (t.type !== 'income' || (t.status !== 'Paid' && t.status !== 'Cleared')) return false;
        const parsed = parseTxDate(t.date);
        return parsed && parsed.year === y && parsed.month === m;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Aggregate expenses/payouts for this specific month & year
    const monthExpense = state.transactions
      .filter((t) => {
        if ((t.type !== 'expense' && t.type !== 'employee_payout') || t.status === 'Cancelled') return false;
        const parsed = parseTxDate(t.date);
        return parsed && parsed.year === y && parsed.month === m;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      monthLabel: monthNames[m],
      fullLabel: `${fullMonthNames[m]} ${y}`,
      year: y,
      month: m,
      isCurrentMonth,
      income: monthIncome,
      expense: monthExpense,
      profit: monthIncome - monthExpense
    };
  });

  const maxMonthValue = Math.max(
    ...liveMonthlyStats.map((item) => Math.max(item.income, item.expense)),
    1000
  );

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block mb-0.5">
            Translatewala Financial Dashboard
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Executive Business Overview</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenAddProject && (
            <button
              onClick={onOpenAddProject}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all active:scale-98 flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ New Project & Auto Financial Entry</span>
            </button>
          )}
          {onOpenAddClient && (
            <button
              onClick={onOpenAddClient}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Client</span>
            </button>
          )}
          <button
            onClick={onOpenRecordPay}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Process Pay</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards - Professional Navy Palette */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Net Profit - Executive Dark Navy Card */}
        <div className="col-span-2 bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800 flex flex-col justify-between min-h-[150px]">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <svg fill="currentColor" height="180" viewBox="0 0 24 24" width="180">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
            </svg>
          </div>

          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Net Operating Profit
              </span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              Live Verified Balance
            </span>
          </div>

          <div className="z-10 mt-4">
            <span className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {formatMoney(netProfit, currency)}
            </span>
          </div>

          <div className="z-10 mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Co-Owners: Mohiyuddin & Shafiulla</span>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1"
            >
              <span>View Audit Log</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Income</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            {formatMoney(totalIncome, currency)}
          </span>
          <p className="text-[10px] font-bold text-emerald-700 mt-1">
            ⏳ Pending from Clients: {formatMoney(pendingReceivables, currency)}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Expenses & Pay</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            {formatMoney(totalExpenses, currency)}
          </span>
          <p className="text-[10px] font-bold text-amber-700 mt-1">
            ⏳ Pending to Employees: {formatMoney(pendingPayouts, currency)}
          </p>
        </div>
      </div>

      {/* Owner Payment Breakdown Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-4 border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-primary" />
            <span>Owner Payout Audit Summary</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct owner payment contributions logged to employees
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-200 text-xs flex-1 sm:flex-initial">
            <span className="text-slate-500 block text-[10px]">Paid by Mohiyuddin</span>
            <span className="font-bold text-blue-700">{formatMoney(mohiyuddinPaid, currency)}</span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-xs flex-1 sm:flex-initial">
            <span className="text-slate-500 block text-[10px]">Paid by Shafiulla</span>
            <span className="font-bold text-emerald-700">{formatMoney(shafiullaPaid, currency)}</span>
          </div>
        </div>
      </div>

      {/* Financial Health Chart */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Financial Health</h3>
          <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            Live 6-Month Real-time Trend
          </span>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-end h-36 mb-6 gap-2 sm:gap-4 pt-6">
            {liveMonthlyStats.map((item) => {
              // Calculate relative bar height percentage based on real income
              const hasData = item.income > 0 || item.expense > 0;
              const heightPct = hasData
                ? Math.max(16, Math.min(100, Math.round((item.income / maxMonthValue) * 100)))
                : 10;

              return (
                <div
                  key={item.fullLabel}
                  className="flex flex-col justify-end items-center flex-1 h-full gap-2 group relative"
                  title={`${item.fullLabel}: Income ${formatMoney(item.income, currency)}, Expense ${formatMoney(item.expense, currency)}`}
                >
                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 relative flex items-start justify-center ${
                      item.isCurrentMonth
                        ? 'bg-primary shadow-sm ring-2 ring-blue-400/30'
                        : item.income > 0
                        ? 'bg-blue-400 group-hover:bg-blue-500'
                        : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Amount label on hover or if current active month */}
                    <div
                      className={`absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black px-1.5 py-0.5 rounded-md transition-all z-20 pointer-events-none ${
                        item.isCurrentMonth
                          ? 'text-primary bg-blue-50 border border-blue-200 opacity-100 shadow-2xs'
                          : 'text-slate-700 bg-white border border-slate-200 opacity-0 group-hover:opacity-100 shadow-2xs'
                      }`}
                    >
                      {formatMoney(item.income, currency)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={`text-[11px] transition-colors ${
                        item.isCurrentMonth
                          ? 'font-black text-primary'
                          : 'font-semibold text-slate-500 group-hover:text-slate-800'
                      }`}
                    >
                      {item.monthLabel}
                    </span>
                    {item.isCurrentMonth && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Pending Receivables
              </p>
              <p className="text-lg font-bold text-slate-900">
                {formatMoney(pendingReceivables, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Pending Payouts
              </p>
              <p className="text-lg font-bold text-amber-700">
                {formatMoney(pendingPayouts, currency)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-slate-900">Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Top Clients */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Top Clients
                </h4>
                <button
                  onClick={() => onNavigateTab('clients')}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  View Directory
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {topClients.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No client records yet.</p>
                ) : (
                  topClients.map((client, idx) => {
                    const bgColors = [
                      'bg-blue-100 text-blue-800',
                      'bg-emerald-100 text-emerald-800',
                      'bg-amber-100 text-amber-800',
                      'bg-purple-100 text-purple-800'
                    ];
                    const badgeClass = bgColors[idx % bgColors.length];

                    return (
                      <div
                        key={client.name}
                        onClick={() => onNavigateTab('clients')}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 ${badgeClass}`}
                          >
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-800 block leading-snug">
                              {client.name}
                            </span>
                            {client.projectsCount > 0 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {client.projectsCount} Project{client.projectsCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatMoney(client.total, currency)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {onOpenAddClient && (
              <button
                onClick={onOpenAddClient}
                className="mt-4 w-full py-2 rounded-xl border border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 text-blue-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </button>
            )}
          </div>

          {/* Top Languages */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Language Breakdown
            </h4>
            {(() => {
              const langCount: Record<string, number> = {};
              state.projects.forEach((p) => {
                const target = p.targetLang || 'English';
                langCount[target] = (langCount[target] || 0) + 1;
              });
              const total = state.projects.length;
              const entries = Object.entries(langCount).sort((a, b) => b[1] - a[1]);

              if (entries.length === 0) {
                return (
                  <div className="py-6 text-center text-slate-400">
                    <p className="text-xs font-medium">No language data recorded yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Create a project to track language stats.</p>
                  </div>
                );
              }

              const colors = ['bg-primary', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600'];

              return (
                <div className="flex flex-col gap-3.5">
                  {entries.slice(0, 4).map(([lang, count], idx) => {
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={lang}>
                        <div className="flex justify-between text-xs font-medium mb-1 text-slate-700">
                          <span>{lang}</span>
                          <span className="font-bold">{pct}% ({count})</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`${colors[idx % colors.length]} h-full rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Recent Activity Timeline */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-bold text-primary hover:underline"
          >
            View All
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          {state.transactions.length === 0 && state.projects.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">Fresh Workspace Ready</p>
              <p className="text-xs text-slate-400 mt-1">
                No recent activity. All client billings, payouts, and project logs will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
              {state.transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex gap-4 relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tx.type === 'employee_payout'
                        ? 'bg-blue-100 text-primary'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : tx.type === 'employee_payout' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                      <span className={`text-xs font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount, currency)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {tx.clientName ? `Client: ${tx.clientName}` : tx.employeeName ? `Employee: ${tx.employeeName}` : tx.category} • {tx.method}
                      {tx.paidByOwner ? ` (Paid by ${tx.paidByOwner})` : ''}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{tx.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
