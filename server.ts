import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { AppState, Client, Project, TeamMember, Transaction } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Clean Initial State (Translatewala Co-Owners, 0 Demo Records)
const initialCleanData: AppState = {
  activeOwner: 'Shafiulla',
  currency: 'INR',
  lastSyncTimestamp: new Date().toISOString(),
  clients: [],
  team: [
    {
      id: 'tm-1',
      name: 'Mohiyuddin',
      role: 'Managing Partner • Arabic Specialist',
      type: 'Employee',
      avatar: '',
      phone: '+91 98765 43210',
      email: 'mohiyuddin@translatewala.com',
      upiId: 'mohiyuddin@upi',
      projectsCount: 0,
      totalEarned: 0,
      paidAmount: 0,
      pendingAmount: 0,
      lastPaidDate: 'N/A'
    },
    {
      id: 'tm-2',
      name: 'Shafiulla',
      role: 'Managing Partner • Operations',
      type: 'Employee',
      avatar: '',
      phone: '+91 98123 45678',
      email: 'shafiulla@translatewala.com',
      upiId: 'shafiulla@upi',
      projectsCount: 0,
      totalEarned: 0,
      paidAmount: 0,
      pendingAmount: 0,
      lastPaidDate: 'N/A'
    }
  ],
  projects: [],
  transactions: [],
  googleSheetWebhook: '',
  autoSyncGoogleSheets: true
};

// Helper to load state from disk or fallback
function loadState(): AppState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content) as AppState;
      if (parsed && typeof parsed === 'object') {
        return {
          ...initialCleanData,
          ...parsed,
          clients: Array.isArray(parsed.clients) ? parsed.clients : [],
          team: Array.isArray(parsed.team) && parsed.team.length > 0 ? parsed.team : initialCleanData.team,
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
        };
      }
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  saveState(initialCleanData);
  return initialCleanData;
}

// Helper to save state to disk
function saveState(state: AppState) {
  try {
    state.lastSyncTimestamp = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

let currentState: AppState = loadState();

// SSE Clients for Real-time multi-device sync
const sseClients: express.Response[] = [];

function broadcastUpdate(data: AppState, sourceDeviceId?: string) {
  const payload = JSON.stringify({ type: 'sync_update', data, sourceDeviceId });
  sseClients.forEach((res) => {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch (err) {
      // ignore broken pipes
    }
  });

  // If user enabled autoSyncGoogleSheets and webhook URL is configured, push to Google Sheets in background
  if (data.googleSheetWebhook && data.autoSyncGoogleSheets !== false) {
    dispatchGoogleSheetSync(data.googleSheetWebhook, data).catch((e) => {
      console.warn('Google Sheet auto-sync background error:', e.message);
    });
  }
}

// Background Google Sheet Webhook Sync Dispatcher
async function dispatchGoogleSheetSync(webhookUrl: string, state: AppState) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  const payload = {
    eventType: 'SYNC_SNAPSHOT',
    timestamp: new Date().toISOString(),
    business: 'Translatewala',
    currency: state.currency,
    owners: ['Mohiyuddin', 'Shafiulla'],
    summary: {
      totalProjects: state.projects.length,
      totalIncome: state.transactions
        .filter((t) => t.type === 'income' && t.status === 'Paid')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
      pendingReceivables: state.projects
        .filter((p) => p.clientPaymentStatus === 'Pending')
        .reduce((sum, p) => sum + (Number(p.clientCharge) || 0), 0),
      totalExpensesAndPayouts: state.transactions
        .filter((t) => t.type !== 'income' && t.status === 'Paid')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
      pendingPayouts: state.projects
        .filter((p) => p.employeePayoutStatus === 'Pending')
        .reduce((sum, p) => sum + (Number(p.employeePayout) || 0), 0)
    },
    projects: state.projects.map((p) => ({
      id: p.id,
      title: p.title,
      clientName: p.clientName,
      sourceLang: p.sourceLang,
      targetLang: p.targetLang,
      workType: p.workType,
      assignedTo: p.assignedTo,
      clientCharge: p.clientCharge,
      clientPaymentStatus: p.clientPaymentStatus || 'Pending',
      employeePayout: p.employeePayout || 0,
      employeePayoutStatus: p.employeePayoutStatus || 'Pending',
      netProfit: p.estProfit,
      status: p.status,
      updatedAt: p.updatedAt
    })),
    transactions: state.transactions.map((t) => ({
      id: t.id,
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.category,
      status: t.status,
      date: t.date,
      method: t.method,
      paidByOwner: t.paidByOwner || '',
      employeeName: t.employeeName || '',
      clientName: t.clientName || '',
      referenceId: t.referenceId || ''
    })),
    team: state.team.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      type: m.type,
      totalEarned: m.totalEarned,
      paidAmount: m.paidAmount,
      pendingAmount: m.pendingAmount,
      lastPaidDate: m.lastPaidDate || 'N/A'
    })),
    clients: state.clients.map((c) => ({
      id: c.id,
      name: c.name,
      totalProjectsCount: c.totalProjectsCount,
      totalBusinessVolume: c.totalBusinessVolume,
      paidAmount: c.paidAmount,
      pendingAmount: c.pendingAmount
    }))
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return response.ok;
}

// REST API Endpoints

// 1. Get current full snapshot
app.get('/api/data', (_req, res) => {
  res.json(currentState);
});

// 2. SSE endpoint for instant live sync across devices
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial data snapshot with device identifier so it won't trigger false collision
  res.write(`data: ${JSON.stringify({ type: 'init', data: currentState })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 3. Batch Sync endpoint for offline queue flush
app.post('/api/sync', (req, res) => {
  const { newState, deviceId } = req.body;
  if (newState) {
    currentState = {
      ...currentState,
      ...newState,
      lastSyncTimestamp: new Date().toISOString()
    };
    saveState(currentState);
    broadcastUpdate(currentState, deviceId);
  }
  res.json({ success: true, data: currentState, serverTime: new Date().toISOString() });
});

// 4. Clear all demo data / Start Fresh
app.post('/api/clear-all', (req, res) => {
  const { deviceId } = req.body || {};

  currentState = {
    ...initialCleanData,
    googleSheetWebhook: currentState.googleSheetWebhook,
    autoSyncGoogleSheets: currentState.autoSyncGoogleSheets,
    team: currentState.team.map((t) => ({
      ...t,
      projectsCount: 0,
      totalEarned: 0,
      paidAmount: 0,
      pendingAmount: 0,
      lastPaidDate: 'N/A'
    })),
    projects: [],
    clients: [],
    transactions: [],
    lastSyncTimestamp: new Date().toISOString()
  };

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);
  res.json({ success: true, message: 'All demo and temporary units cleared. Fresh workspace ready.', data: currentState });
});

app.post('/api/clear-demo', (req, res) => {
  const { deviceId } = req.body || {};

  currentState = {
    ...initialCleanData,
    googleSheetWebhook: currentState.googleSheetWebhook,
    autoSyncGoogleSheets: currentState.autoSyncGoogleSheets,
    team: currentState.team.map((t) => ({
      ...t,
      projectsCount: 0,
      totalEarned: 0,
      paidAmount: 0,
      pendingAmount: 0,
      lastPaidDate: 'N/A'
    })),
    projects: [],
    clients: [],
    transactions: [],
    lastSyncTimestamp: new Date().toISOString()
  };

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);
  res.json({ success: true, message: 'Clean slate activated. 0 demo units.', data: currentState });
});

// 5. Google Sheets Sync Endpoint
app.post('/api/google-sheets/sync', async (req, res) => {
  const { webhookUrl, autoSync, deviceId } = req.body;

  if (webhookUrl !== undefined) {
    currentState.googleSheetWebhook = webhookUrl;
  }
  if (autoSync !== undefined) {
    currentState.autoSyncGoogleSheets = Boolean(autoSync);
  }

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);

  const targetUrl = webhookUrl || currentState.googleSheetWebhook;
  if (!targetUrl) {
    return res.json({ success: true, message: 'Settings saved (no webhook URL provided)', appState: currentState });
  }

  try {
    const ok = await dispatchGoogleSheetSync(targetUrl, currentState);
    if (ok) {
      return res.json({ success: true, message: 'Successfully synced live data with Google Sheets!', appState: currentState });
    } else {
      return res.json({ success: false, message: 'Google Sheet webhook responded with non-200 status code', appState: currentState });
    }
  } catch (err: any) {
    return res.json({ success: false, message: `Could not reach Google Sheets Webhook: ${err.message}`, appState: currentState });
  }
});

// 6. Create new transaction (Income, Expense, or Owner Employee Payout)
app.post('/api/transactions', (req, res) => {
  const { transaction, deviceId } = req.body as { transaction: Partial<Transaction>; deviceId?: string };

  const newTx: Transaction = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: transaction.title || 'New Entry',
    amount: Number(transaction.amount) || 0,
    type: transaction.type || 'expense',
    category: transaction.category || 'Operating Cost',
    status: transaction.status || 'Paid',
    date: transaction.date || new Date().toISOString().split('T')[0],
    method: transaction.method || 'UPI',
    paidByOwner: transaction.paidByOwner, // 'Mohiyuddin' or 'Shafiulla'
    employeeId: transaction.employeeId,
    employeeName: transaction.employeeName,
    clientName: transaction.clientName,
    notes: transaction.notes || '',
    referenceId: transaction.referenceId || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
    createdAt: new Date().toISOString()
  };

  currentState.transactions.unshift(newTx);

  // If this is an employee payout, update team member's paid / pending records
  if (newTx.type === 'employee_payout' && newTx.employeeId) {
    const teamMember = currentState.team.find((t) => t.id === newTx.employeeId);
    if (teamMember) {
      teamMember.paidAmount += newTx.amount;
      teamMember.pendingAmount = Math.max(0, teamMember.totalEarned - teamMember.paidAmount);
      teamMember.lastPaidDate = newTx.date;
      if (newTx.paidByOwner) {
        teamMember.lastPaidBy = newTx.paidByOwner;
      }
    }
  }

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);

  res.json({ success: true, transaction: newTx, appState: currentState });
});

// 7. Process Payout Specifically (Owner -> Employee)
app.post('/api/payouts', (req, res) => {
  const { employeeId, amount, paidByOwner, method, referenceId, notes, deviceId } = req.body;

  const teamMember = currentState.team.find((t) => t.id === employeeId);
  if (!teamMember) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const payoutAmount = Number(amount) || 0;
  const ownerName: 'Mohiyuddin' | 'Shafiulla' = paidByOwner === 'Mohiyuddin' ? 'Mohiyuddin' : 'Shafiulla';

  const newTx: Transaction = {
    id: `tx-payout-${Date.now()}`,
    title: `Payout to ${teamMember.name}`,
    amount: payoutAmount,
    type: 'employee_payout',
    category: teamMember.type === 'Freelancer' ? 'Freelancer Fee' : 'Employee Payout',
    status: 'Paid',
    date: new Date().toISOString().split('T')[0],
    method: method || 'UPI',
    paidByOwner: ownerName,
    employeeId: teamMember.id,
    employeeName: teamMember.name,
    referenceId: referenceId || `UPI-${Math.floor(Math.random() * 9000000 + 1000000)}`,
    notes: notes || `Paid by ${ownerName} via ${method || 'UPI'}`,
    createdAt: new Date().toISOString()
  };

  teamMember.paidAmount += payoutAmount;
  teamMember.pendingAmount = Math.max(0, teamMember.totalEarned - teamMember.paidAmount);
  teamMember.lastPaidDate = newTx.date;
  teamMember.lastPaidBy = ownerName;

  currentState.transactions.unshift(newTx);
  saveState(currentState);
  broadcastUpdate(currentState, deviceId);

  res.json({ success: true, transaction: newTx, appState: currentState });
});

// 8. Create/Update Project with automated double-entry financial hooks
app.post('/api/projects', (req, res) => {
  const { project, deviceId } = req.body as { project: Partial<Project>; deviceId?: string };

  const clientCharge = Number(project.clientCharge) || 0;
  const employeePayout = Number(project.employeePayout) || 0;
  const clientStatus = project.clientPaymentStatus || 'Pending';
  const empStatus = project.employeePayoutStatus || 'Pending';

  if (project.id) {
    const idx = currentState.projects.findIndex((p) => p.id === project.id);
    if (idx !== -1) {
      currentState.projects[idx] = {
        ...currentState.projects[idx],
        ...project,
        clientCharge,
        employeePayout,
        clientPaymentStatus: clientStatus,
        employeePayoutStatus: empStatus,
        estProfit: clientCharge - employeePayout,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    const projId = `proj-${Date.now()}`;
    const newProj: Project = {
      id: projId,
      title: project.title || 'New Project',
      clientName: project.clientName || 'Direct Client',
      sourceLang: project.sourceLang || 'Arabic',
      targetLang: project.targetLang || 'English',
      workType: project.workType || 'Document',
      assignedTo: project.assignedTo || 'Unassigned',
      deadline: project.deadline || 'In 7 days',
      clientCharge,
      clientPaymentStatus: clientStatus,
      employeePayout,
      employeePayoutStatus: empStatus,
      estProfit: clientCharge - employeePayout,
      status: project.status || 'In Progress',
      notes: project.notes || '',
      updatedAt: new Date().toISOString()
    };
    currentState.projects.unshift(newProj);

    // Auto-create client if not present
    if (newProj.clientName) {
      const cIdx = currentState.clients.findIndex((c) => c.name.toLowerCase() === newProj.clientName.toLowerCase());
      if (cIdx >= 0) {
        currentState.clients[cIdx].totalProjectsCount = (currentState.clients[cIdx].totalProjectsCount || 0) + 1;
        currentState.clients[cIdx].totalBusinessVolume = (currentState.clients[cIdx].totalBusinessVolume || 0) + clientCharge;
        if (clientStatus === 'Paid') {
          currentState.clients[cIdx].paidAmount = (currentState.clients[cIdx].paidAmount || 0) + clientCharge;
        } else {
          currentState.clients[cIdx].pendingAmount = (currentState.clients[cIdx].pendingAmount || 0) + clientCharge;
        }
      } else {
        currentState.clients.unshift({
          id: `cli-${Date.now()}`,
          name: newProj.clientName,
          company: newProj.clientName,
          totalProjectsCount: 1,
          totalBusinessVolume: clientCharge,
          paidAmount: clientStatus === 'Paid' ? clientCharge : 0,
          pendingAmount: clientStatus === 'Pending' ? clientCharge : 0
        });
      }
    }

    // Auto-create income transaction
    if (clientCharge > 0) {
      currentState.transactions.unshift({
        id: `tx-inc-${Date.now()}`,
        title: `Payment: ${newProj.title}`,
        amount: clientCharge,
        type: 'income',
        category: 'Income',
        status: clientStatus,
        date: new Date().toISOString().split('T')[0],
        method: 'Bank Transfer',
        clientName: newProj.clientName,
        projectId: projId,
        notes: `Auto-created revenue for project ${newProj.title}`,
        createdAt: new Date().toISOString()
      });
    }

    // Auto-create employee payout transaction
    if (employeePayout > 0 && newProj.assignedTo && newProj.assignedTo !== 'Unassigned') {
      const emp = currentState.team.find((t) => t.name.toLowerCase() === newProj.assignedTo.toLowerCase());
      currentState.transactions.unshift({
        id: `tx-emp-${Date.now() + 1}`,
        title: `Payout: ${newProj.title} (${newProj.assignedTo})`,
        amount: employeePayout,
        type: 'employee_payout',
        category: 'Employee Payout',
        status: empStatus,
        date: new Date().toISOString().split('T')[0],
        method: 'UPI',
        employeeId: emp?.id,
        employeeName: newProj.assignedTo,
        projectId: projId,
        notes: `Auto-created payout for project ${newProj.title}`,
        createdAt: new Date().toISOString()
      });

      if (emp) {
        emp.projectsCount = (emp.projectsCount || 0) + 1;
        emp.totalEarned = (emp.totalEarned || 0) + employeePayout;
        if (empStatus === 'Paid') {
          emp.paidAmount = (emp.paidAmount || 0) + employeePayout;
        } else {
          emp.pendingAmount = (emp.pendingAmount || 0) + employeePayout;
        }
      }
    }
  }

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);

  res.json({ success: true, appState: currentState });
});

// 9. Delete Transaction Endpoint
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { deviceId } = req.query as { deviceId?: string };

  const idx = currentState.transactions.findIndex((t) => t.id === id);
  if (idx !== -1) {
    currentState.transactions.splice(idx, 1);
    saveState(currentState);
    broadcastUpdate(currentState, deviceId);
    return res.json({ success: true, appState: currentState });
  }
  res.status(404).json({ error: 'Transaction not found' });
});

// 10. Update Transaction Endpoint
app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { transaction, deviceId } = req.body as { transaction: Partial<Transaction>; deviceId?: string };

  const idx = currentState.transactions.findIndex((t) => t.id === id);
  if (idx !== -1) {
    currentState.transactions[idx] = {
      ...currentState.transactions[idx],
      ...transaction
    };
    saveState(currentState);
    broadcastUpdate(currentState, deviceId);
    return res.json({ success: true, appState: currentState });
  }
  res.status(404).json({ error: 'Transaction not found' });
});

// 11. Delete Project Endpoint (also cleans up associated project transactions)
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { deviceId } = req.query as { deviceId?: string };

  const idx = currentState.projects.findIndex((p) => p.id === id);
  if (idx !== -1) {
    currentState.projects.splice(idx, 1);
    // Remove auto-created project transactions to avoid orphaned demo units
    currentState.transactions = currentState.transactions.filter((t) => t.projectId !== id);

    saveState(currentState);
    broadcastUpdate(currentState, deviceId);
    return res.json({ success: true, appState: currentState });
  }
  res.status(404).json({ error: 'Project not found' });
});

// 12. Add or Update Team Member Endpoint
app.post('/api/team', (req, res) => {
  const { member, deviceId } = req.body as { member: Partial<TeamMember>; deviceId?: string };

  if (member.id) {
    const idx = currentState.team.findIndex((t) => t.id === member.id);
    if (idx !== -1) {
      currentState.team[idx] = {
        ...currentState.team[idx],
        ...member
      };
    }
  } else {
    const newMember: TeamMember = {
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
    currentState.team.unshift(newMember);
  }

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);
  res.json({ success: true, appState: currentState });
});

// 13. Delete Team Member Endpoint
app.delete('/api/team/:id', (req, res) => {
  const { id } = req.params;
  const { deviceId } = req.query as { deviceId?: string };

  const idx = currentState.team.findIndex((t) => t.id === id);
  if (idx !== -1) {
    currentState.team.splice(idx, 1);
    saveState(currentState);
    broadcastUpdate(currentState, deviceId);
    return res.json({ success: true, appState: currentState });
  }
  res.status(404).json({ error: 'Team member not found' });
});

// 14. Add or Update Client Endpoint
app.post('/api/clients', (req, res) => {
  const { client, deviceId } = req.body as { client: Partial<Client>; deviceId?: string };

  if (!currentState.clients) {
    currentState.clients = [];
  }

  if (client.id) {
    const idx = currentState.clients.findIndex((c) => c.id === client.id);
    if (idx !== -1) {
      currentState.clients[idx] = {
        ...currentState.clients[idx],
        ...client
      };
    }
  } else {
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: client.name || 'New Client',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      currency: client.currency || currentState.currency,
      totalProjectsCount: client.totalProjectsCount || 0,
      totalBusinessVolume: client.totalBusinessVolume || 0,
      paidAmount: client.paidAmount || 0,
      pendingAmount: client.pendingAmount || 0,
      notes: client.notes || ''
    };
    currentState.clients.unshift(newClient);
  }

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);
  res.json({ success: true, appState: currentState });
});

// 15. Delete Client Endpoint
app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const { deviceId } = req.query as { deviceId?: string };

  if (!currentState.clients) currentState.clients = [];
  const idx = currentState.clients.findIndex((c) => c.id === id);
  if (idx !== -1) {
    currentState.clients.splice(idx, 1);
    saveState(currentState);
    broadcastUpdate(currentState, deviceId);
    return res.json({ success: true, appState: currentState });
  }
  res.status(404).json({ error: 'Client not found' });
});

// 16. 1-Click Receive Payment for Project Endpoint
app.post('/api/projects/:id/receive-payment', (req, res) => {
  const { id } = req.params;
  const { method, owner, deviceId } = req.body as { method?: string; owner?: string; deviceId?: string };

  const projIdx = currentState.projects.findIndex((p) => p.id === id);
  if (projIdx === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const proj = currentState.projects[projIdx];
  proj.status = 'Paid';
  proj.clientPaymentStatus = 'Paid';
  proj.updatedAt = new Date().toISOString();

  // Record income transaction automatically
  const newTx: Transaction = {
    id: `tx-recv-${Date.now()}`,
    title: `Payment Received: ${proj.title}`,
    amount: proj.clientCharge,
    type: 'income',
    category: 'Income',
    status: 'Paid',
    date: new Date().toISOString().split('T')[0],
    method: (method as any) || 'UPI',
    paidByOwner: (owner as any) || currentState.activeOwner,
    clientName: proj.clientName,
    projectId: proj.id,
    notes: `Received client payment for project ${proj.title}`,
    createdAt: new Date().toISOString()
  };

  currentState.transactions.unshift(newTx);

  // Update Client stats if exists
  if (!currentState.clients) currentState.clients = [];
  const clientObj = currentState.clients.find((c) => c.name.toLowerCase() === proj.clientName.toLowerCase());
  if (clientObj) {
    clientObj.paidAmount = (clientObj.paidAmount || 0) + proj.clientCharge;
    clientObj.pendingAmount = Math.max(0, (clientObj.pendingAmount || 0) - proj.clientCharge);
  }

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);
  res.json({ success: true, appState: currentState });
});

// 17. Reset data to clean state (no demo units)
app.post('/api/reset', (_req, res) => {
  currentState = JSON.parse(JSON.stringify(initialCleanData));
  saveState(currentState);
  broadcastUpdate(currentState);
  res.json({ success: true, data: currentState });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Translatewala Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
