import React, { useState } from 'react';
import { AppState, Client } from '../types';
import { formatMoney } from '../lib/formatters';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  FolderKanban,
  CheckCircle,
  Clock,
  Trash2,
  Edit2
} from 'lucide-react';

interface ClientsViewProps {
  state: AppState;
  onOpenAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onOpenAddProjectForClient: (clientName: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  state,
  onOpenAddClient,
  onEditClient,
  onDeleteClient,
  onOpenAddProjectForClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const currency = state.currency;
  const clientsList = state.clients || [];

  const filteredClients = clientsList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Clients & Customers</h2>
          <p className="text-xs text-slate-500">Manage client directory, project volume and receivables</p>
        </div>

        <button
          onClick={onOpenAddClient}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by client or company name..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 shadow-xs transition-all"
        />
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">No Clients Found</p>
            <p className="text-xs text-slate-500 mt-1">Add your first customer to track projects and business volume.</p>
          </div>
          <button
            onClick={onOpenAddClient}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            Add Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            // Compute real client stats from projects and transactions if needed
            const clientProjects = state.projects.filter(
              (p) => p.clientName.toLowerCase() === client.name.toLowerCase()
            );
            const totalVol = clientProjects.reduce((sum, p) => sum + p.clientCharge, 0) || (client.totalBusinessVolume || 0);
            const paidVol = clientProjects
              .filter((p) => p.status === 'Paid')
              .reduce((sum, p) => sum + p.clientCharge, 0) || (client.paidAmount || 0);
            const pendingVol = Math.max(0, totalVol - paidVol);

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        {client.name}
                      </h3>
                      {client.company && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{client.company}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditClient(client)}
                      className="text-slate-300 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-all"
                      title="Edit Client"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingClientId(client.id)}
                      className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                      title="Delete Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 border-t border-b border-slate-50 py-2.5">
                  {client.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Work
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatMoney(totalVol, currency)}
                    </span>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                      Paid
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {formatMoney(paidVol, currency)}
                    </span>
                  </div>

                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                      Pending
                    </span>
                    <span className="text-sm font-extrabold text-amber-700">
                      {formatMoney(pendingVol, currency)}
                    </span>
                  </div>
                </div>

                {/* Quick Add Project action */}
                <button
                  onClick={() => onOpenAddProjectForClient(client.name)}
                  className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Create Project for {client.name}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClientId && (
        <DeleteConfirmModal
          title="Delete Client Profile?"
          description="Are you sure you want to remove this client? Their existing projects will remain intact in your history."
          onClose={() => setDeletingClientId(null)}
          onConfirm={() => {
            onDeleteClient(deletingClientId);
            setDeletingClientId(null);
          }}
        />
      )}
    </div>
  );
};
