import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { AppState, Client, Project, TeamMember, Transaction } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initial seed data
const initialData: AppState = {
  activeOwner: 'Shafiulla',
  currency: 'INR',
  lastSyncTimestamp: new Date().toISOString(),
  clients: [
    {
      id: 'cli-1',
      name: 'Qatar Media',
      company: 'Qatar Media Group',
      email: 'contact@qatarmedia.qa',
      phone: '+974 4400 1234',
      totalProjectsCount: 5,
      totalBusinessVolume: 12500,
      paidAmount: 8300,
      pendingAmount: 4200
    },
    {
      id: 'cli-2',
      name: 'Dubai Tech',
      company: 'Global Tech Solutions',
      email: 'billing@dubaitech.ae',
      phone: '+971 4 300 5678',
      totalProjectsCount: 4,
      totalBusinessVolume: 9400,
      paidAmount: 6250,
      pendingAmount: 3150
    },
    {
      id: 'cli-3',
      name: 'GCC Partners',
      company: 'GCC Legal & Media',
      email: 'info@gccpartners.org',
      phone: '+966 11 200 8899',
      totalProjectsCount: 3,
      totalBusinessVolume: 7800,
      paidAmount: 5000,
      pendingAmount: 2800
    },
    {
      id: 'cli-4',
      name: 'Oasis Law',
      company: 'Oasis Law Firm',
      email: 'accounts@oasislaw.com',
      phone: '+971 4 800 9900',
      totalProjectsCount: 2,
      totalBusinessVolume: 4500,
      paidAmount: 4500,
      pendingAmount: 0
    }
  ],
  team: [
    {
      id: 'tm-1',
      name: 'Mohiyuddin',
      role: 'Arabic Translator • Co-Owner',
      type: 'Employee',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      phone: '+91 98765 43210',
      email: 'mohiyuddin@translatewala.com',
      upiId: 'mohiyuddin@upi',
      projectsCount: 14,
      totalEarned: 18500,
      paidAmount: 18500,
      pendingAmount: 0,
      lastPaidDate: '2026-08-01',
      lastPaidBy: 'Shafiulla'
    },
    {
      id: 'tm-2',
      name: 'Shafiulla',
      role: 'Managing Partner • Co-Owner',
      type: 'Employee',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      phone: '+91 98123 45678',
      email: 'shafiulla@translatewala.com',
      upiId: 'shafiulla@upi',
      projectsCount: 18,
      totalEarned: 22000,
      paidAmount: 22000,
      pendingAmount: 0,
      lastPaidDate: '2026-08-01',
      lastPaidBy: 'Mohiyuddin'
    },
    {
      id: 'tm-3',
      name: 'Shakurullah',
      role: 'Arabic Senior Specialist',
      type: 'Employee',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      phone: '+91 98222 11100',
      email: 'shakurullah@translatewala.com',
      upiId: 'shakur@okaxis',
      projectsCount: 14,
      totalEarned: 1250,
      paidAmount: 1000,
      pendingAmount: 250,
      lastPaidDate: '2026-08-05',
      lastPaidBy: 'Mohiyuddin'
    },
    {
      id: 'tm-4',
      name: 'Rajesh Kumar',
      role: 'Hindi Lead Translator',
      type: 'Employee',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
      phone: '+91 97111 22334',
      email: 'rajesh@translatewala.com',
      upiId: 'rajesh@ybl',
      projectsCount: 10,
      totalEarned: 12500,
      paidAmount: 12500,
      pendingAmount: 0,
      lastPaidDate: '2026-08-10',
      lastPaidBy: 'Mohiyuddin'
    },
    {
      id: 'tm-5',
      name: 'Anita Desai',
      role: 'Hindi & Gujarati Specialist',
      type: 'Freelancer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
      phone: '+91 96555 44332',
      email: 'anita.d@gmail.com',
      upiId: 'anitadesai@icici',
      projectsCount: 12,
      totalEarned: 24000,
      paidAmount: 24000,
      pendingAmount: 0,
      lastPaidDate: '2026-08-08',
      lastPaidBy: 'Shafiulla'
    },
    {
      id: 'tm-6',
      name: 'Employee A',
      role: 'Bengali Expert',
      type: 'Employee',
      avatar: '',
      phone: '+91 91234 56789',
      email: 'employeeA@translatewala.com',
      upiId: 'employeea@paytm',
      projectsCount: 8,
      totalEarned: 800,
      paidAmount: 800,
      pendingAmount: 0,
      lastPaidDate: '2026-08-02',
      lastPaidBy: 'Shafiulla'
    },
    {
      id: 'tm-7',
      name: 'Freelancer B',
      role: 'Hindi Specialist',
      type: 'Freelancer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
      phone: '+91 99887 76655',
      email: 'freelancerB@gmail.com',
      upiId: 'freeb@upi',
      projectsCount: 3,
      totalEarned: 450,
      paidAmount: 0,
      pendingAmount: 450,
      lastPaidDate: 'N/A',
      lastPaidBy: undefined
    },
    {
      id: 'tm-8',
      name: 'Priya Sharma',
      role: 'Marathi Translator',
      type: 'Freelancer',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      phone: '+91 94433 22110',
      email: 'priya.sharma@langtech.io',
      upiId: 'priyasharma@sbi',
      projectsCount: 6,
      totalEarned: 8800,
      paidAmount: 8800,
      pendingAmount: 0,
      lastPaidDate: '2026-08-02',
      lastPaidBy: 'Shafiulla'
    },
    {
      id: 'tm-9',
      name: 'Maria G.',
      role: 'Spanish Localization Expert',
      type: 'Freelancer',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      phone: '+1 555 234 5678',
      email: 'maria.loc@gmail.com',
      upiId: 'mariag@paypal',
      projectsCount: 5,
      totalEarned: 1200,
      paidAmount: 1200,
      pendingAmount: 0,
      lastPaidDate: '2026-08-06',
      lastPaidBy: 'Mohiyuddin'
    }
  ],
  projects: [
    {
      id: 'proj-101',
      title: 'Qatar Media Group',
      clientName: 'Qatar Media',
      sourceLang: 'Arabic',
      targetLang: 'English',
      workType: 'Document',
      assignedTo: 'Shakurullah',
      deadline: 'Oct 24',
      clientCharge: 800,
      estProfit: 350,
      status: 'In Progress',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'proj-102',
      title: 'Global Tech Solutions',
      clientName: 'Dubai Tech',
      sourceLang: 'English',
      targetLang: 'Spanish',
      workType: 'Website Loc.',
      assignedTo: 'Maria G.',
      deadline: 'Oct 18',
      deliveredDate: 'Oct 18',
      clientCharge: 1200,
      estProfit: 550,
      status: 'Completed',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'proj-103',
      title: 'Oasis Law Firm',
      clientName: 'Oasis Law',
      sourceLang: 'French',
      targetLang: 'English',
      workType: 'Legal Trans.',
      assignedTo: 'Unassigned',
      deadline: 'Nov 02',
      clientCharge: 450,
      estProfit: 200,
      status: 'Pending Start',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'proj-104',
      title: 'GCC Partners Localization',
      clientName: 'GCC Partners',
      sourceLang: 'English',
      targetLang: 'Arabic',
      workType: 'Certified Translation',
      assignedTo: 'Mohiyuddin',
      deadline: 'Aug 10',
      deliveredDate: 'Aug 09',
      clientCharge: 2800,
      estProfit: 1100,
      status: 'Completed',
      updatedAt: new Date().toISOString()
    }
  ],
  transactions: [
    {
      id: 'tx-1',
      title: 'Payout to Rajesh Kumar',
      amount: 12500,
      type: 'employee_payout',
      category: 'Employee Payout',
      status: 'Paid',
      date: '2026-08-10',
      method: 'UPI',
      paidByOwner: 'Mohiyuddin',
      employeeId: 'tm-4',
      employeeName: 'Rajesh Kumar',
      referenceId: 'UPI-98312001',
      notes: 'Monthly translation settlement for Hindi projects',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-2',
      title: 'Payout to Anita Desai',
      amount: 24000,
      type: 'employee_payout',
      category: 'Freelancer Fee',
      status: 'Paid',
      date: '2026-08-08',
      method: 'Bank Transfer',
      paidByOwner: 'Shafiulla',
      employeeId: 'tm-5',
      employeeName: 'Anita Desai',
      referenceId: 'HDFC-8823910',
      notes: 'Cleared freelance invoice Sep 16 - Sep 30',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-3',
      title: 'Payout to Mohiyuddin (Salary)',
      amount: 18500,
      type: 'employee_payout',
      category: 'Employee Payout',
      status: 'Paid',
      date: '2026-08-01',
      method: 'UPI',
      paidByOwner: 'Shafiulla',
      employeeId: 'tm-1',
      employeeName: 'Mohiyuddin',
      referenceId: 'UPI-7712390',
      notes: 'Executive salary payout',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-4',
      title: 'Payout to Priya Sharma',
      amount: 8800,
      type: 'employee_payout',
      category: 'Freelancer Fee',
      status: 'Paid',
      date: '2026-08-02',
      method: 'Bank Transfer',
      paidByOwner: 'Shafiulla',
      employeeId: 'tm-8',
      employeeName: 'Priya Sharma',
      referenceId: 'ICICI-009123',
      notes: 'Marathi translation batch payout',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-5',
      title: 'Payout to Shakurullah',
      amount: 1000,
      type: 'employee_payout',
      category: 'Employee Payout',
      status: 'Paid',
      date: '2026-08-05',
      method: 'Cash',
      paidByOwner: 'Mohiyuddin',
      employeeId: 'tm-3',
      employeeName: 'Shakurullah',
      referenceId: 'CASH-0805',
      notes: 'Partial project advance',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-6',
      title: 'Global Tech Inc. Payment',
      amount: 2400,
      type: 'income',
      category: 'Income',
      status: 'Paid',
      date: '2026-08-10',
      method: 'Bank Transfer',
      clientName: 'Global Tech Inc.',
      notes: 'Invoice #INV-2023-088 settled',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-7',
      title: 'Nexus Studios Project Fee',
      amount: 1850,
      type: 'income',
      category: 'Income',
      status: 'Pending',
      date: '2026-08-11',
      method: 'PayPal',
      clientName: 'Nexus Studios',
      notes: 'Awaiting client release',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-8',
      title: 'Elena Rodriguez Payment',
      amount: 350,
      type: 'income',
      category: 'Income',
      status: 'Paid',
      date: '2026-08-08',
      method: 'Cash',
      clientName: 'Elena Rodriguez',
      notes: 'Express document translation',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-9',
      title: 'Alpha Marketing Receivable',
      amount: 4200,
      type: 'income',
      category: 'Income',
      status: 'Overdue',
      date: '2026-07-28',
      method: 'Bank Transfer',
      clientName: 'Alpha Marketing',
      notes: 'Reminder sent 2 days ago',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-10',
      title: 'AWS Cloud Services',
      amount: 4200,
      type: 'expense',
      category: 'Software',
      status: 'Paid',
      date: '2026-08-10',
      method: 'Bank Transfer',
      notes: 'Monthly cloud hosting and storage',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-11',
      title: 'WeWork Spaces',
      amount: 35000,
      type: 'expense',
      category: 'Office Rent',
      status: 'Pending',
      date: '2026-08-05',
      method: 'Bank Transfer',
      notes: 'August office suite rent',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-12',
      title: 'Google Ads Campaign',
      amount: 15000,
      type: 'expense',
      category: 'Marketing',
      status: 'Cleared',
      date: '2026-07-28',
      method: 'Bank Transfer',
      notes: 'Search ads lead generation',
      createdAt: new Date().toISOString()
    }
  ]
};

// Helper to load state from disk or memory
function loadState(): AppState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content) as AppState;
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  saveState(initialData);
  return initialData;
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
const clients: express.Response[] = [];

function broadcastUpdate(data: AppState, sourceDeviceId?: string) {
  const payload = JSON.stringify({ type: 'sync_update', data, sourceDeviceId });
  clients.forEach((res) => {
    res.write(`data: ${payload}\n\n`);
  });
}

// REST API Endpoints
app.get('/api/data', (_req, res) => {
  res.json(currentState);
});

// SSE endpoint for instant live sync across devices
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  // Send initial data snapshot
  res.write(`data: ${JSON.stringify({ type: 'init', data: currentState })}\n\n`);

  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

// Batch Sync endpoint for offline queue flush
app.post('/api/sync', (req, res) => {
  const { newState, deviceId } = req.body;
  if (newState) {
    currentState = {
      ...newState,
      lastSyncTimestamp: new Date().toISOString()
    };
    saveState(currentState);
    broadcastUpdate(currentState, deviceId);
  }
  res.json({ success: true, data: currentState, serverTime: new Date().toISOString() });
});

// Create new transaction (Income, Expense, or Owner Employee Payout)
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

// Process Payout Specifically (Owner -> Employee)
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

// Create/Update Project
app.post('/api/projects', (req, res) => {
  const { project, deviceId } = req.body as { project: Partial<Project>; deviceId?: string };

  if (project.id) {
    const idx = currentState.projects.findIndex((p) => p.id === project.id);
    if (idx !== -1) {
      currentState.projects[idx] = {
        ...currentState.projects[idx],
        ...project,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: project.title || 'New Project',
      clientName: project.clientName || 'Direct Client',
      sourceLang: project.sourceLang || 'Arabic',
      targetLang: project.targetLang || 'English',
      workType: project.workType || 'Document',
      assignedTo: project.assignedTo || 'Unassigned',
      deadline: project.deadline || 'In 7 days',
      clientCharge: Number(project.clientCharge) || 0,
      estProfit: Number(project.estProfit) || 0,
      status: project.status || 'In Progress',
      notes: project.notes || '',
      updatedAt: new Date().toISOString()
    };
    currentState.projects.unshift(newProj);
  }

  saveState(currentState);
  broadcastUpdate(currentState, deviceId);

  res.json({ success: true, appState: currentState });
});

// Delete Transaction Endpoint
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

// Update Transaction Endpoint
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

// Delete Project Endpoint
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { deviceId } = req.query as { deviceId?: string };

  const idx = currentState.projects.findIndex((p) => p.id === id);
  if (idx !== -1) {
    currentState.projects.splice(idx, 1);
    saveState(currentState);
    broadcastUpdate(currentState, deviceId);
    return res.json({ success: true, appState: currentState });
  }
  res.status(404).json({ error: 'Project not found' });
});

// Add or Update Team Member Endpoint
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

// Delete Team Member Endpoint
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

// Add or Update Client Endpoint
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

// Delete Client Endpoint
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

// 1-Click Receive Payment for Project Endpoint
app.post('/api/projects/:id/receive-payment', (req, res) => {
  const { id } = req.params;
  const { method, owner, deviceId } = req.body as { method?: string; owner?: string; deviceId?: string };

  const projIdx = currentState.projects.findIndex((p) => p.id === id);
  if (projIdx === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const proj = currentState.projects[projIdx];
  proj.status = 'Paid';
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

// Reset data to initial seed
app.post('/api/reset', (_req, res) => {
  currentState = JSON.parse(JSON.stringify(initialData));
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
