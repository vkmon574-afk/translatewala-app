export type Currency = 'INR' | 'USD';

export type Owner = 'Mohiyuddin' | 'Shafiulla';

export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Cleared';

export type PaymentMethod = 'UPI' | 'Bank Transfer' | 'Cash' | 'PayPal' | 'Cheque';

export type WorkType = 'Document' | 'Website Loc.' | 'Legal Trans.' | 'Audio/Video' | 'Certified Translation';

export type ProjectStatus = 'In Progress' | 'Pending Start' | 'Completed' | 'Paid';

export interface Project {
  id: string;
  title: string;
  clientName: string;
  sourceLang: string;
  targetLang: string;
  workType: WorkType;
  assignedTo: string;
  deadline: string;
  deliveredDate?: string;
  clientCharge: number;
  clientPaymentStatus?: PaymentStatus;
  employeePayout?: number;
  employeePayoutStatus?: PaymentStatus;
  estProfit: number;
  status: ProjectStatus;
  notes?: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  type: 'Employee' | 'Freelancer';
  avatar?: string;
  phone?: string;
  email?: string;
  upiId?: string;
  projectsCount: number;
  totalEarned: number;
  paidAmount: number;
  pendingAmount: number;
  lastPaidDate?: string;
  lastPaidBy?: Owner;
}

export type TransactionCategory =
  | 'Income'
  | 'Employee Payout'
  | 'Operating Cost'
  | 'Software'
  | 'Office Rent'
  | 'Marketing'
  | 'Freelancer Fee';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'employee_payout';
  category: TransactionCategory;
  status: PaymentStatus;
  date: string;
  method: PaymentMethod;
  paidByOwner?: Owner; // 'Mohiyuddin' or 'Shafiulla' when owner pays
  employeeId?: string;
  employeeName?: string;
  projectId?: string;
  clientName?: string;
  notes?: string;
  referenceId?: string;
  createdAt: string;
  syncedFromDevice?: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  currency?: Currency;
  totalProjectsCount?: number;
  totalBusinessVolume?: number;
  paidAmount?: number;
  pendingAmount?: number;
  notes?: string;
}

export interface AppState {
  projects: Project[];
  clients: Client[];
  team: TeamMember[];
  transactions: Transaction[];
  activeOwner: Owner;
  currency: Currency;
  lastSyncTimestamp: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: 'completed' | 'payment' | 'invoice' | 'payout';
  amount?: number;
  owner?: Owner;
}
