import React, { useState } from 'react';
import { AppState, Project, ProjectStatus } from '../types';
import { formatMoney, getStatusBadgeClass } from '../lib/formatters';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import {
  Search,
  SlidersHorizontal,
  Plus,
  ArrowRight,
  MoreVertical,
  Calendar,
  UserCheck,
  Trash2,
  Edit2,
  DollarSign,
  Wallet
} from 'lucide-react';

interface ProjectsViewProps {
  state: AppState;
  onOpenAddProject: () => void;
  onEditProject?: (project: Project) => void;
  onUpdateProjectStatus: (id: string, status: ProjectStatus) => void;
  onDeleteProject?: (id: string) => void;
  onReceivePayment?: (projectId: string) => void;
  onToggleClientPayment?: (project: Project) => void;
  onToggleEmployeePayout?: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  state,
  onOpenAddProject,
  onEditProject,
  onUpdateProjectStatus,
  onDeleteProject,
  onReceivePayment,
  onToggleClientPayment,
  onToggleEmployeePayout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | ProjectStatus>('All');
  const [sortAsc, setSortAsc] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const filterChips: Array<'All' | ProjectStatus> = [
    'All',
    'In Progress',
    'Pending Start',
    'Completed',
    'Paid'
  ];

  const filteredProjects = state.projects
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sourceLang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.targetLang.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === 'All' ? true : p.status === selectedFilter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      return sortAsc
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Search & Filter Bar */}
      <div className="sticky top-16 z-30 bg-slate-50/95 backdrop-blur-sm pt-2 pb-3 -mx-4 px-4 flex gap-2">
        <div className="relative flex-1 bg-white rounded-full border border-slate-200 shadow-xs h-11 flex items-center px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects, clients, translators..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
        </div>

        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="h-11 w-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs hover:bg-slate-100 transition-colors"
          title="Toggle sort order"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 snap-x">
        {filterChips.map((chip) => {
          const isActive = selectedFilter === chip;
          return (
            <button
              key={chip}
              onClick={() => setSelectedFilter(chip)}
              className={`snap-start px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* List Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Recent Projects ({filteredProjects.length})</h2>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Sort: {sortAsc ? 'Oldest First' : 'Newest First'}
        </button>
      </div>

      {/* Project Cards */}
      <div className="flex flex-col gap-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 text-slate-500 my-4">
            <p className="text-sm font-medium">No projects match your search or filter.</p>
            <button
              onClick={onOpenAddProject}
              className="mt-3 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const statusClass = getStatusBadgeClass(project.status);
            const edgeBorderColor =
              project.status === 'Completed'
                ? 'bg-emerald-500'
                : project.status === 'In Progress'
                ? 'bg-amber-500'
                : 'bg-slate-300';

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all"
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${edgeBorderColor}`} />

                <div className="flex justify-between items-start mb-3 pl-1">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1.5 ${statusClass}`}
                    >
                      {project.status}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {project.title}
                    </h3>
                  </div>

                  {/* Status update menu button & edit & delete */}
                  <div className="flex items-center gap-1">
                    {onEditProject && (
                      <button
                        onClick={() => onEditProject(project)}
                        className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-lg transition-all"
                        title="Edit Project & Financials"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {onDeleteProject && (
                      <button
                        onClick={() => setDeletingProjectId(project.id)}
                        className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="relative group/menu">
                      <button className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-6 hidden group-hover/menu:flex flex-col bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-20 w-36">
                        <button
                          onClick={() => onUpdateProjectStatus(project.id, 'In Progress')}
                          className="text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg"
                        >
                          Set In Progress
                        </button>
                        <button
                          onClick={() => onUpdateProjectStatus(project.id, 'Completed')}
                          className="text-left px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 font-medium rounded-lg"
                        >
                          Set Completed
                        </button>
                        <button
                          onClick={() => onUpdateProjectStatus(project.id, 'Paid')}
                          className="text-left px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 font-medium rounded-lg"
                        >
                          Set Paid
                        </button>
                        {onDeleteProject && (
                          <button
                            onClick={() => setDeletingProjectId(project.id)}
                            className="text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-medium rounded-lg border-t border-slate-100 mt-1 pt-1"
                          >
                            Delete Project
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Name & Languages */}
                <div className="bg-slate-50/80 rounded-xl p-3 mb-3 flex flex-wrap justify-between items-center text-xs gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Client
                    </span>
                    <span className="font-bold text-slate-900">{project.clientName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Language Pair
                    </span>
                    <div className="flex items-center font-semibold text-slate-800">
                      <span>{project.sourceLang}</span>
                      <ArrowRight className="w-3.5 h-3.5 mx-1 text-slate-400" />
                      <span>{project.targetLang}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Type
                    </span>
                    <span className="font-semibold text-slate-800">{project.workType}</span>
                  </div>
                </div>

                {/* Translator Assignment & Deadline Banner */}
                <div className="bg-slate-50/80 rounded-xl p-3 mb-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Assigned Employee
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                        {project.assignedTo.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{project.assignedTo}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      {project.deliveredDate ? 'Delivered' : 'Deadline'}
                    </span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {project.deliveredDate || project.deadline}
                    </span>
                  </div>
                </div>

                {/* Integrated Financial & Status Badges (Client & Employee) */}
                <div className="bg-slate-900/5 rounded-2xl p-3.5 flex flex-col gap-2.5 border border-slate-200/60">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Client Payment Status */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Client Revenue
                        </span>
                        <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {formatMoney(project.clientCharge, state.currency)}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (onToggleClientPayment) {
                            onToggleClientPayment(project);
                          } else if (onReceivePayment) {
                            onReceivePayment(project.id);
                          }
                        }}
                        className={`mt-2 py-1 px-2 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                          project.clientPaymentStatus === 'Paid' || project.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 hover:bg-emerald-600 hover:text-white border border-amber-200'
                        }`}
                        title="Click to toggle Client Payment status"
                      >
                        {project.clientPaymentStatus === 'Paid' || project.status === 'Paid' ? (
                          <span>✅ Received</span>
                        ) : (
                          <span>⏳ Pending (Click to Receive)</span>
                        )}
                      </button>
                    </div>

                    {/* Employee Payout Status */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Employee Pay
                        </span>
                        <p className="text-sm font-extrabold text-amber-900 mt-0.5">
                          {formatMoney(project.employeePayout || (project.clientCharge - project.estProfit) || 0, state.currency)}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (onToggleEmployeePayout) {
                            onToggleEmployeePayout(project);
                          }
                        }}
                        className={`mt-2 py-1 px-2 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                          project.employeePayoutStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 hover:bg-emerald-600 hover:text-white border border-amber-200'
                        }`}
                        title="Click to toggle Employee Payout status"
                      >
                        {project.employeePayoutStatus === 'Paid' ? (
                          <span>✅ Paid to Employee</span>
                        ) : (
                          <span>⏳ Pending (Click to Pay)</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Profit summary bar */}
                  <div className="flex justify-between items-center text-xs px-1 pt-1 border-t border-slate-200/50">
                    <span className="text-[11px] font-bold text-slate-600">Net Business Profit</span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {formatMoney(project.estProfit, state.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onOpenAddProject}
        className="fixed bottom-20 right-5 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-40"
        title="Add Project"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Delete Confirmation Modal */}
      {deletingProjectId && onDeleteProject && (
        <DeleteConfirmModal
          title="Delete Translation Project?"
          description="Are you sure you want to remove this project? This will permanently remove it from all connected devices."
          onClose={() => setDeletingProjectId(null)}
          onConfirm={() => {
            onDeleteProject(deletingProjectId);
            setDeletingProjectId(null);
          }}
        />
      )}
    </div>
  );
};
