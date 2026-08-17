import React, { useState } from 'react';
import { useSync } from './hooks/useSync';
import { Client, Project, TeamMember, Transaction } from './types';
import { TabType, BottomNav } from './components/BottomNav';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { ClientsView } from './components/ClientsView';
import { IncomeView } from './components/IncomeView';
import { ExpensesView } from './components/ExpensesView';
import { TeamView } from './components/TeamView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { ProcessPayModal } from './components/modals/ProcessPayModal';
import { NewTransactionModal } from './components/modals/NewTransactionModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { NewTeamMemberModal } from './components/modals/NewTeamMemberModal';
import { NewClientModal } from './components/modals/NewClientModal';
import { GoogleSheetsSyncModal } from './components/modals/GoogleSheetsSyncModal';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function App() {
  const {
    state,
    isOnline,
    isLiveSynced,
    isSyncing,
    pendingCount,
    recordTransaction,
    updateTransaction,
    deleteTransaction,
    processPayout,
    addOrUpdateProject,
    deleteProject,
    addOrUpdateTeamMember,
    deleteTeamMember,
    addOrUpdateClient,
    deleteClient,
    receiveProjectPayment,
    setCurrency,
    setActiveOwner,
    clearAllDemoData,
    syncGoogleSheets,
    flushPendingQueue
  } = useSync();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Modal States
  const [payTargetMember, setPayTargetMember] = useState<TeamMember | null>(null);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTxDefaultType, setNewTxDefaultType] = useState<'income' | 'expense' | 'employee_payout'>('income');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectInitialClient, setNewProjectInitialClient] = useState('');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  // Tab Title helper
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'projects':
        return 'Projects Management';
      case 'clients':
        return 'Clients & Customers';
      case 'income':
        return 'Income & Revenue';
      case 'expenses':
        return 'Expenses & Operations';
      case 'team':
        return 'Team & Translators';
      case 'transactions':
        return 'Audit & Transaction History';
      default:
        return 'Translatewala';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Fixed Header Bar */}
      <Navbar
        activeOwner={state.activeOwner}
        onOwnerChange={setActiveOwner}
        currency={state.currency}
        onCurrencyChange={setCurrency}
        isOnline={isOnline}
        isLiveSynced={isLiveSynced}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        onFlushQueue={flushPendingQueue}
        activeTabTitle={getTabTitle()}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenAddProject={() => {
          setEditingProject(null);
          setNewProjectInitialClient('');
          setIsNewProjectModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto pt-20 pb-24 px-4 min-h-[calc(100vh-80px)]">
        {/* Offline / Pending Sync Floating Notice Banner if disconnected */}
        {!isOnline && pendingCount > 0 && (
          <div className="mb-4 bg-amber-500 text-white rounded-2xl p-3 text-xs font-semibold shadow-md flex justify-between items-center animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>Offline Mode: {pendingCount} actions stored locally</span>
            </div>
            <button
              onClick={flushPendingQueue}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold"
            >
              Sync Now
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            state={state}
            onOpenNewInvoice={() => {
              setEditingTransaction(null);
              setNewTxDefaultType('income');
              setIsNewTxModalOpen(true);
            }}
            onOpenRecordPay={() => {
              const defaultMember = state.team[0] || null;
              if (defaultMember) setPayTargetMember(defaultMember);
            }}
            onOpenAddClient={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            onOpenAddProject={() => {
              setEditingProject(null);
              setNewProjectInitialClient('');
              setIsNewProjectModalOpen(true);
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            state={state}
            onOpenAddProject={() => {
              setEditingProject(null);
              setNewProjectInitialClient('');
              setIsNewProjectModalOpen(true);
            }}
            onEditProject={(proj) => {
              setEditingProject(proj);
              setIsNewProjectModalOpen(true);
            }}
            onUpdateProjectStatus={(id, status) => {
              addOrUpdateProject({ id, status });
            }}
            onDeleteProject={(id) => deleteProject(id)}
            onReceivePayment={(projectId) => receiveProjectPayment(projectId)}
            onToggleClientPayment={(project) => {
              const nextStatus = project.clientPaymentStatus === 'Paid' ? 'Pending' : 'Paid';
              addOrUpdateProject({
                id: project.id,
                clientPaymentStatus: nextStatus,
                status: nextStatus === 'Paid' ? 'Paid' : project.status
              });
            }}
            onToggleEmployeePayout={(project) => {
              const nextEmpStatus = project.employeePayoutStatus === 'Paid' ? 'Pending' : 'Paid';
              addOrUpdateProject({
                id: project.id,
                employeePayoutStatus: nextEmpStatus
              });
            }}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            state={state}
            onOpenAddClient={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            onEditClient={(client) => {
              setEditingClient(client);
              setIsClientModalOpen(true);
            }}
            onDeleteClient={(id) => deleteClient(id)}
            onOpenAddProjectForClient={(clientName) => {
              setNewProjectInitialClient(clientName);
              setIsNewProjectModalOpen(true);
            }}
          />
        )}

        {activeTab === 'income' && (
          <IncomeView
            state={state}
            onOpenRecordIncome={() => {
              setEditingTransaction(null);
              setNewTxDefaultType('income');
              setIsNewTxModalOpen(true);
            }}
            onNavigateTransactions={() => setActiveTab('transactions')}
            onDeleteTransaction={(id) => deleteTransaction(id)}
            onUpdateTransaction={(tx) => updateTransaction(tx)}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsNewTxModalOpen(true);
            }}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            state={state}
            onOpenNewExpense={() => {
              setEditingTransaction(null);
              setNewTxDefaultType('expense');
              setIsNewTxModalOpen(true);
            }}
            onNavigateTransactions={() => setActiveTab('transactions')}
            onDeleteTransaction={(id) => deleteTransaction(id)}
          />
        )}

        {activeTab === 'team' && (
          <TeamView
            state={state}
            onOpenProcessPay={(member) => setPayTargetMember(member)}
            onOpenAddMember={() => {
              setEditingTeamMember(null);
              setIsTeamModalOpen(true);
            }}
            onEditMember={(member) => {
              setEditingTeamMember(member);
              setIsTeamModalOpen(true);
            }}
            onDeleteMember={(id) => deleteTeamMember(id)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionHistoryView
            state={state}
            onOpenRecordPay={() => {
              const defaultMember = state.team[0] || null;
              if (defaultMember) setPayTargetMember(defaultMember);
            }}
            onOpenRecordIncome={() => {
              setEditingTransaction(null);
              setNewTxDefaultType('income');
              setIsNewTxModalOpen(true);
            }}
            onDeleteTransaction={(id) => deleteTransaction(id)}
            onUpdateTransaction={(tx) => updateTransaction(tx)}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsNewTxModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      {payTargetMember && (
        <ProcessPayModal
          member={payTargetMember}
          activeOwner={state.activeOwner}
          onClose={() => setPayTargetMember(null)}
          onConfirmPayout={(data) => {
            processPayout(data);
          }}
        />
      )}

      {isNewTxModalOpen && (
        <NewTransactionModal
          activeOwner={state.activeOwner}
          defaultType={newTxDefaultType}
          initialTransaction={editingTransaction}
          onClose={() => {
            setIsNewTxModalOpen(false);
            setEditingTransaction(null);
          }}
          onRecord={(tx) => {
            if (tx.id) {
              updateTransaction(tx as Partial<Transaction> & { id: string });
            } else {
              recordTransaction(tx);
            }
          }}
        />
      )}

      {isNewProjectModalOpen && (
        <NewProjectModal
          clients={state.clients}
          team={state.team}
          initialClientName={newProjectInitialClient}
          projectToEdit={editingProject}
          onClose={() => {
            setIsNewProjectModalOpen(false);
            setEditingProject(null);
            setNewProjectInitialClient('');
          }}
          onSave={(proj) => {
            addOrUpdateProject(proj);
          }}
        />
      )}

      {isGoogleSheetsModalOpen && (
        <GoogleSheetsSyncModal
          state={state}
          onClose={() => setIsGoogleSheetsModalOpen(false)}
          onSyncGoogleSheets={syncGoogleSheets}
          onClearAllDemoData={clearAllDemoData}
        />
      )}

      {isTeamModalOpen && (
        <NewTeamMemberModal
          member={editingTeamMember}
          onClose={() => {
            setIsTeamModalOpen(false);
            setEditingTeamMember(null);
          }}
          onSave={(member) => {
            addOrUpdateTeamMember(member);
          }}
        />
      )}

      {isClientModalOpen && (
        <NewClientModal
          client={editingClient}
          onClose={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
          }}
          onSave={(clientData) => {
            addOrUpdateClient(clientData);
          }}
          onSaveAndCreateProject={(clientName) => {
            setNewProjectInitialClient(clientName);
            setIsNewProjectModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
