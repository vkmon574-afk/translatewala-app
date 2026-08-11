import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Client, Currency, Owner, Project, TeamMember, Transaction } from '../types';
import {
  loadLocalState,
  saveLocalState,
  getPendingQueue,
  addToPendingQueue,
  clearPendingQueue,
  getDeviceId
} from '../lib/syncEngine';

const initialFallbackState: AppState = {
  activeOwner: 'Shafiulla',
  currency: 'INR',
  lastSyncTimestamp: new Date().toISOString(),
  team: [],
  projects: [],
  clients: [],
  transactions: []
};

export function useSync() {
  const [state, setState] = useState<AppState>(() => loadLocalState() || initialFallbackState);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(getPendingQueue().length);
  const deviceId = useRef(getDeviceId()).current;

  // Sync state changes to localStorage whenever state updates
  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushPendingQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsLiveSynced(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Flush offline queue to server
  const flushPendingQueue = useCallback(async () => {
    const queue = getPendingQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    try {
      for (const item of queue) {
        if (item.type === 'transaction') {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction: item.payload, deviceId })
          });
        } else if (item.type === 'payout') {
          await fetch('/api/payouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...item.payload, deviceId })
          });
        } else if (item.type === 'project') {
          await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: item.payload, deviceId })
          });
        } else if (item.type === 'delete_transaction') {
          await fetch(`/api/transactions/${item.payload.id}?deviceId=${deviceId}`, { method: 'DELETE' });
        } else if (item.type === 'update_transaction') {
          await fetch(`/api/transactions/${item.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction: item.payload, deviceId })
          });
        } else if (item.type === 'delete_project') {
          await fetch(`/api/projects/${item.payload.id}?deviceId=${deviceId}`, { method: 'DELETE' });
        } else if (item.type === 'team_member') {
          await fetch('/api/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member: item.payload, deviceId })
          });
        } else if (item.type === 'delete_team_member') {
          await fetch(`/api/team/${item.payload.id}?deviceId=${deviceId}`, { method: 'DELETE' });
        } else if (item.type === 'client') {
          await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client: item.payload, deviceId })
          });
        } else if (item.type === 'delete_client') {
          await fetch(`/api/clients/${item.payload.id}?deviceId=${deviceId}`, { method: 'DELETE' });
        }
      }
      clearPendingQueue();
      setPendingCount(0);
      fetchLatestData();
    } catch (err) {
      console.error('Failed to flush offline queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [deviceId]);

  // Fetch full data snapshot from backend
  const fetchLatestData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data: AppState = await res.json();
        setState(data);
        setIsLiveSynced(true);
      }
    } catch (err) {
      console.warn('Backend server fetch failed (offline mode):', err);
      setIsLiveSynced(false);
    }
  }, []);

  // Establish SSE for real-time multi-device synchronization
  useEffect(() => {
    fetchLatestData();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsLiveSynced(true);
        setIsOnline(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'init' || parsed.type === 'sync_update') {
            // Ignore updates that came from this device if we've local changes
            if (parsed.sourceDeviceId !== deviceId && parsed.data) {
              setState(parsed.data);
            }
          }
        } catch (e) {
          console.error('Error parsing SSE message:', e);
        }
      };

      eventSource.onerror = () => {
        setIsLiveSynced(false);
        // Retry connection gracefully
      };
    } catch (err) {
      setIsLiveSynced(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchLatestData, deviceId]);

  // Actions
  const recordTransaction = useCallback(
    async (tx: Partial<Transaction>) => {
      // Optimistic update
      const newTx: Transaction = {
        id: `tx-opt-${Date.now()}`,
        title: tx.title || 'Entry',
        amount: Number(tx.amount) || 0,
        type: tx.type || 'expense',
        category: tx.category || 'Operating Cost',
        status: tx.status || 'Paid',
        date: tx.date || new Date().toISOString().split('T')[0],
        method: tx.method || 'UPI',
        paidByOwner: tx.paidByOwner,
        employeeId: tx.employeeId,
        employeeName: tx.employeeName,
        clientName: tx.clientName,
        notes: tx.notes || '',
        referenceId: tx.referenceId || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
        createdAt: new Date().toISOString()
      };

      setState((prev) => {
        const nextTx = [newTx, ...prev.transactions];
        let nextTeam = [...prev.team];

        if (newTx.type === 'employee_payout' && newTx.employeeId) {
          nextTeam = nextTeam.map((tm) => {
            if (tm.id === newTx.employeeId) {
              const newPaid = tm.paidAmount + newTx.amount;
              return {
                ...tm,
                paidAmount: newPaid,
                pendingAmount: Math.max(0, tm.totalEarned - newPaid),
                lastPaidDate: newTx.date,
                lastPaidBy: newTx.paidByOwner || tm.lastPaidBy
              };
            }
            return tm;
          });
        }

        return {
          ...prev,
          transactions: nextTx,
          team: nextTeam,
          lastSyncTimestamp: new Date().toISOString()
        };
      });

      if (!isOnline) {
        addToPendingQueue({ type: 'transaction', payload: tx });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: tx, deviceId })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'transaction', payload: tx });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const processPayout = useCallback(
    async (payoutData: {
      employeeId: string;
      amount: number;
      paidByOwner: Owner;
      method: any;
      referenceId?: string;
      notes?: string;
    }) => {
      // Optimistic update
      const targetEmp = state.team.find((t) => t.id === payoutData.employeeId);
      const empName = targetEmp ? targetEmp.name : 'Employee';

      const newTx: Transaction = {
        id: `tx-opt-${Date.now()}`,
        title: `Payout to ${empName}`,
        amount: Number(payoutData.amount) || 0,
        type: 'employee_payout',
        category: targetEmp?.type === 'Freelancer' ? 'Freelancer Fee' : 'Employee Payout',
        status: 'Paid',
        date: new Date().toISOString().split('T')[0],
        method: payoutData.method || 'UPI',
        paidByOwner: payoutData.paidByOwner,
        employeeId: payoutData.employeeId,
        employeeName: empName,
        referenceId: payoutData.referenceId || `UPI-${Math.floor(Math.random() * 9000000 + 1000000)}`,
        notes: payoutData.notes || `Paid by ${payoutData.paidByOwner}`,
        createdAt: new Date().toISOString()
      };

      setState((prev) => {
        const nextTeam = prev.team.map((t) => {
          if (t.id === payoutData.employeeId) {
            const newPaid = t.paidAmount + payoutData.amount;
            return {
              ...t,
              paidAmount: newPaid,
              pendingAmount: Math.max(0, t.totalEarned - newPaid),
              lastPaidDate: newTx.date,
              lastPaidBy: payoutData.paidByOwner
            };
          }
          return t;
        });

        return {
          ...prev,
          transactions: [newTx, ...prev.transactions],
          team: nextTeam,
          lastSyncTimestamp: new Date().toISOString()
        };
      });

      if (!isOnline) {
        addToPendingQueue({ type: 'payout', payload: payoutData });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch('/api/payouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payoutData, deviceId })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'payout', payload: payoutData });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, state.team, deviceId]
  );

  const addOrUpdateProject = useCallback(
    async (projData: Partial<Project>) => {
      // Optimistic state
      setState((prev) => {
        let updatedProjects = [...prev.projects];
        let updatedClients = [...prev.clients];
        let updatedTransactions = [...prev.transactions];

        const projId = projData.id || `proj-${Date.now()}`;
        const clientCharge = Number(projData.clientCharge) || 0;
        const employeePayout = Number(projData.employeePayout) || 0;
        const clientStatus = projData.clientPaymentStatus || 'Pending';
        const empStatus = projData.employeePayoutStatus || 'Pending';

        const newP: Project = {
          id: projId,
          title: projData.title || 'New Project',
          clientName: projData.clientName || 'Direct Client',
          sourceLang: projData.sourceLang || 'Arabic',
          targetLang: projData.targetLang || 'English',
          workType: projData.workType || 'Document',
          assignedTo: projData.assignedTo || 'Unassigned',
          deadline: projData.deadline || 'In 7 days',
          clientCharge,
          clientPaymentStatus: clientStatus,
          employeePayout,
          employeePayoutStatus: empStatus,
          estProfit: clientCharge - employeePayout,
          status: projData.status || 'In Progress',
          notes: projData.notes || '',
          updatedAt: new Date().toISOString()
        };

        if (projData.id) {
          updatedProjects = updatedProjects.map((p) =>
            p.id === projData.id ? { ...p, ...newP } : p
          );
        } else {
          updatedProjects.unshift(newP);
        }

        // Auto-add or update Client
        if (newP.clientName) {
          const clientIdx = updatedClients.findIndex(
            (c) => c.name.toLowerCase() === newP.clientName.toLowerCase()
          );
          if (clientIdx >= 0) {
            const existingClient = updatedClients[clientIdx];
            updatedClients[clientIdx] = {
              ...existingClient,
              totalProjectsCount: (existingClient.totalProjectsCount || 0) + (projData.id ? 0 : 1),
              totalBusinessVolume: (existingClient.totalBusinessVolume || 0) + (projData.id ? 0 : clientCharge),
              pendingAmount: clientStatus === 'Pending' ? (existingClient.pendingAmount || 0) + clientCharge : existingClient.pendingAmount,
              paidAmount: clientStatus === 'Paid' ? (existingClient.paidAmount || 0) + clientCharge : existingClient.paidAmount
            };
          } else {
            updatedClients.push({
              id: `cli-${Date.now()}`,
              name: newP.clientName,
              company: newP.clientName,
              totalProjectsCount: 1,
              totalBusinessVolume: clientCharge,
              paidAmount: clientStatus === 'Paid' ? clientCharge : 0,
              pendingAmount: clientStatus === 'Pending' ? clientCharge : 0
            });
          }
        }

        // Auto-create transactions for new project
        if (!projData.id) {
          if (clientCharge > 0) {
            const incomeTx: Transaction = {
              id: `tx-inc-${Date.now()}`,
              title: `Payment: ${newP.title}`,
              amount: clientCharge,
              type: 'income',
              category: 'Income',
              status: clientStatus,
              date: new Date().toISOString().split('T')[0],
              method: 'Bank Transfer',
              clientName: newP.clientName,
              projectId: projId,
              notes: `Auto-created entry for project ${newP.title}`,
              createdAt: new Date().toISOString()
            };
            updatedTransactions.unshift(incomeTx);
          }

          if (employeePayout > 0 && newP.assignedTo && newP.assignedTo !== 'Unassigned') {
            const empObj = prev.team.find(
              (t) => t.name.toLowerCase() === newP.assignedTo.toLowerCase()
            );
            const payoutTx: Transaction = {
              id: `tx-emp-${Date.now() + 1}`,
              title: `Payout: ${newP.title} (${newP.assignedTo})`,
              amount: employeePayout,
              type: 'employee_payout',
              category: 'Employee Payout',
              status: empStatus,
              date: new Date().toISOString().split('T')[0],
              method: 'UPI',
              employeeId: empObj?.id,
              employeeName: newP.assignedTo,
              projectId: projId,
              notes: `Auto-created payout for project ${newP.title}`,
              createdAt: new Date().toISOString()
            };
            updatedTransactions.unshift(payoutTx);
          }
        }

        return {
          ...prev,
          projects: updatedProjects,
          clients: updatedClients,
          transactions: updatedTransactions,
          lastSyncTimestamp: new Date().toISOString()
        };
      });

      if (!isOnline) {
        addToPendingQueue({ type: 'project', payload: projData });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: projData, deviceId })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'project', payload: projData });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        lastSyncTimestamp: new Date().toISOString()
      }));

      if (!isOnline) {
        addToPendingQueue({ type: 'delete_transaction', payload: { id } });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch(`/api/transactions/${id}?deviceId=${deviceId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'delete_transaction', payload: { id } });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const updateTransaction = useCallback(
    async (tx: Partial<Transaction> & { id: string }) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === tx.id ? { ...t, ...tx } : t)),
        lastSyncTimestamp: new Date().toISOString()
      }));

      if (!isOnline) {
        addToPendingQueue({ type: 'update_transaction', payload: tx });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch(`/api/transactions/${tx.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: tx, deviceId })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'update_transaction', payload: tx });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
        lastSyncTimestamp: new Date().toISOString()
      }));

      if (!isOnline) {
        addToPendingQueue({ type: 'delete_project', payload: { id } });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch(`/api/projects/${id}?deviceId=${deviceId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'delete_project', payload: { id } });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const addOrUpdateTeamMember = useCallback(
    async (member: Partial<TeamMember>) => {
      setState((prev) => {
        let updatedTeam = [...prev.team];
        if (member.id) {
          updatedTeam = updatedTeam.map((t) => (t.id === member.id ? { ...t, ...member } : t));
        } else {
          const newM: TeamMember = {
            id: `tm-${Date.now()}`,
            name: member.name || 'New Member',
            role: member.role || 'Translator',
            type: member.type || 'Employee',
            avatar: member.avatar || '',
            phone: member.phone || '',
            email: member.email || '',
            upiId: member.upiId || '',
            projectsCount: member.projectsCount || 0,
            totalEarned: member.totalEarned || 0,
            paidAmount: member.paidAmount || 0,
            pendingAmount: member.pendingAmount || 0,
            lastPaidDate: member.lastPaidDate || 'N/A'
          };
          updatedTeam.unshift(newM);
        }
        return { ...prev, team: updatedTeam, lastSyncTimestamp: new Date().toISOString() };
      });

      if (!isOnline) {
        addToPendingQueue({ type: 'team_member', payload: member });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member, deviceId })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'team_member', payload: member });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const deleteTeamMember = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        team: prev.team.filter((t) => t.id !== id),
        lastSyncTimestamp: new Date().toISOString()
      }));

      if (!isOnline) {
        addToPendingQueue({ type: 'delete_team_member', payload: { id } });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch(`/api/team/${id}?deviceId=${deviceId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'delete_team_member', payload: { id } });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const addOrUpdateClient = useCallback(
    async (client: Partial<Client>) => {
      setState((prev) => {
        let updatedClients = [...(prev.clients || [])];
        if (client.id) {
          updatedClients = updatedClients.map((c) => (c.id === client.id ? { ...c, ...client } : c));
        } else {
          const newC: Client = {
            id: `cli-${Date.now()}`,
            name: client.name || 'New Client',
            company: client.company || '',
            email: client.email || '',
            phone: client.phone || '',
            currency: client.currency || prev.currency,
            totalProjectsCount: client.totalProjectsCount || 0,
            totalBusinessVolume: client.totalBusinessVolume || 0,
            paidAmount: client.paidAmount || 0,
            pendingAmount: client.pendingAmount || 0,
            notes: client.notes || ''
          };
          updatedClients.unshift(newC);
        }
        return { ...prev, clients: updatedClients, lastSyncTimestamp: new Date().toISOString() };
      });

      if (!isOnline) {
        addToPendingQueue({ type: 'client', payload: client });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client, deviceId })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'client', payload: client });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      setState((prev) => ({
        ...prev,
        clients: (prev.clients || []).filter((c) => c.id !== id),
        lastSyncTimestamp: new Date().toISOString()
      }));

      if (!isOnline) {
        addToPendingQueue({ type: 'delete_client', payload: { id } });
        setPendingCount(getPendingQueue().length);
        return;
      }

      setIsSyncing(true);
      try {
        const res = await fetch(`/api/clients/${id}?deviceId=${deviceId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        addToPendingQueue({ type: 'delete_client', payload: { id } });
        setPendingCount(getPendingQueue().length);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, deviceId]
  );

  const receiveProjectPayment = useCallback(
    async (projectId: string, method: string = 'UPI') => {
      const proj = state.projects.find((p) => p.id === projectId);
      if (!proj) return;

      setIsSyncing(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/receive-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, owner: state.activeOwner, deviceId })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.appState) {
            setState(resData.appState);
          }
        }
      } catch (e) {
        // Fallback local update
        setState((prev) => {
          const updatedProjects = prev.projects.map((p) =>
            p.id === projectId ? { ...p, status: 'Paid' as const } : p
          );
          const newTx: Transaction = {
            id: `tx-recv-${Date.now()}`,
            title: `Payment Received: ${proj.title}`,
            amount: proj.clientCharge,
            type: 'income',
            category: 'Income',
            status: 'Paid',
            date: new Date().toISOString().split('T')[0],
            method: (method as any) || 'UPI',
            paidByOwner: prev.activeOwner,
            clientName: proj.clientName,
            projectId: proj.id,
            createdAt: new Date().toISOString()
          };
          return {
            ...prev,
            projects: updatedProjects,
            transactions: [newTx, ...prev.transactions]
          };
        });
      } finally {
        setIsSyncing(false);
      }
    },
    [state.projects, state.activeOwner, deviceId]
  );

  const setCurrency = useCallback((currency: Currency) => {
    setState((prev) => ({ ...prev, currency }));
  }, []);

  const setActiveOwner = useCallback((activeOwner: Owner) => {
    setState((prev) => ({ ...prev, activeOwner }));
  }, []);

  const resetData = useCallback(async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const resData = await res.json();
        setState(resData.data);
        clearPendingQueue();
        setPendingCount(0);
      }
    } catch (e) {
      console.error('Reset failed:', e);
    }
  }, []);

  return {
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
    resetData,
    flushPendingQueue,
    refresh: fetchLatestData
  };
}
