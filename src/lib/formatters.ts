import { Currency, Owner, PaymentStatus, ProjectStatus } from '../types';

export function formatMoney(amount: number, currency: Currency = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

export function getOwnerBadgeClass(owner?: Owner): string {
  if (owner === 'Mohiyuddin') {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  if (owner === 'Shafiulla') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

export function getStatusBadgeClass(status: PaymentStatus | ProjectStatus): string {
  switch (status) {
    case 'Paid':
    case 'Completed':
    case 'Cleared':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'In Progress':
    case 'Pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Pending Start':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Overdue':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
