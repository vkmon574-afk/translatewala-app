import React, { useState } from 'react';
import { Client, Project, ProjectStatus, TeamMember, WorkType } from '../../types';
import { X, FolderPlus, ArrowRight, Wallet, UserCheck, DollarSign, Calculator } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onSave: (proj: Partial<Project>) => void;
  clients?: Client[];
  team?: TeamMember[];
  initialClientName?: string;
  projectToEdit?: Project | null;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  onClose,
  onSave,
  clients = [],
  team = [],
  initialClientName = '',
  projectToEdit
}) => {
  const [title, setTitle] = useState(projectToEdit?.title || '');
  const [clientName, setClientName] = useState(projectToEdit?.clientName || initialClientName);
  const [sourceLang, setSourceLang] = useState(projectToEdit?.sourceLang || 'Arabic');
  const [targetLang, setTargetLang] = useState(projectToEdit?.targetLang || 'English');
  const [workType, setWorkType] = useState<WorkType>(projectToEdit?.workType || 'Document');
  
  // Assigned Employee
  const [assignedTo, setAssignedTo] = useState(
    projectToEdit?.assignedTo || (team[0] ? team[0].name : 'Mohiyuddin')
  );
  
  const [deadline, setDeadline] = useState(projectToEdit?.deadline || 'In 5 days');
  
  // Financials
  const [clientCharge, setClientCharge] = useState<number | ''>(
    projectToEdit ? projectToEdit.clientCharge : 10000
  );
  const [clientPaymentStatus, setClientPaymentStatus] = useState<'Pending' | 'Paid'>(
    (projectToEdit?.clientPaymentStatus as 'Pending' | 'Paid') || 'Pending'
  );

  const [employeePayout, setEmployeePayout] = useState<number | ''>(
    projectToEdit ? projectToEdit.employeePayout || 4000 : 4000
  );
  const [employeePayoutStatus, setEmployeePayoutStatus] = useState<'Pending' | 'Paid'>(
    (projectToEdit?.employeePayoutStatus as 'Pending' | 'Paid') || 'Pending'
  );

  const [status, setStatus] = useState<ProjectStatus>(projectToEdit?.status || 'In Progress');
  const [notes, setNotes] = useState(projectToEdit?.notes || '');

  // Calculate Net Profit live
  const chargeNum = Number(clientCharge) || 0;
  const payoutNum = Number(employeePayout) || 0;
  const netProfit = chargeNum - payoutNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientCharge) return;

    onSave({
      id: projectToEdit?.id,
      title,
      clientName: clientName || title,
      sourceLang,
      targetLang,
      workType,
      assignedTo,
      deadline,
      clientCharge: chargeNum,
      clientPaymentStatus,
      employeePayout: payoutNum,
      employeePayoutStatus,
      estProfit: netProfit,
      status,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider">
              Simplified Entry
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            {projectToEdit ? 'Edit Project & Financials' : 'New Project & Auto Financial Entry'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Record client revenue, assign employee, and set payout in 1 single step.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Section 1: Basic Info & Client */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">1. Project & Client</h4>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Project Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Legal Documents Translation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select / Enter Client Name</label>
                <div className="relative">
                  <input
                    type="text"
                    list="clients-list"
                    placeholder="e.g. Qatar Media Group"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 transition-all"
                  />
                  <datalist id="clients-list">
                    {clients.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Work Type</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as WorkType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 transition-all"
                >
                  <option value="Document">Document Translation</option>
                  <option value="Legal Trans.">Legal Translation</option>
                  <option value="Website Loc.">Website Localization</option>
                  <option value="Certified Translation">Certified Translation</option>
                  <option value="Audio/Video">Audio/Video</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Source Language</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 transition-all"
                >
                  <option value="Arabic">Arabic</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 transition-all"
                >
                  <option value="English">English</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Client Financials (Revenue) */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  2. Client Payment (Incoming Revenue)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Client Charge Amount *</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 10000"
                  value={clientCharge}
                  onChange={(e) => setClientCharge(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-sm font-extrabold text-slate-900 outline-none focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Client Payment Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClientPaymentStatus('Pending')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      clientPaymentStatus === 'Pending'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⏳ Pending (To Receive)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientPaymentStatus('Paid')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      clientPaymentStatus === 'Paid'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✅ Received (Paid)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Employee Assignment & Payout */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
              <UserCheck className="w-4 h-4 text-amber-700" />
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                3. Assign Employee & Set Payout
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Translator / Employee</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-amber-600 transition-all"
                >
                  {team.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.type})
                    </option>
                  ))}
                  <option value="Mohiyuddin">Mohiyuddin</option>
                  <option value="Shakurullah">Shakurullah</option>
                  <option value="Rajesh Kumar">Rajesh Kumar</option>
                  <option value="Anita Desai">Anita Desai</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Employee Payout Amount</label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 4000"
                  value={employeePayout}
                  onChange={(e) => setEmployeePayout(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-sm font-extrabold text-slate-900 outline-none focus:border-amber-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Employee Payout Status</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmployeePayoutStatus('Pending')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    employeePayoutStatus === 'Pending'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ⏳ Pending (To Pay)
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeePayoutStatus('Paid')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    employeePayoutStatus === 'Paid'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✅ Paid to Employee
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Profit Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-between border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Calculated Business Profit</p>
                <p className="text-xs text-slate-300 font-semibold">
                  Revenue: <span className="text-emerald-400 font-bold">₹{chargeNum.toLocaleString()}</span> - Payout: <span className="text-amber-400 font-bold">₹{payoutNum.toLocaleString()}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-base font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{netProfit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Section 4: Deadline & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Deadline Date</label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. Oct 28"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Project Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 transition-all"
              >
                <option value="In Progress">In Progress</option>
                <option value="Pending Start">Pending Start</option>
                <option value="Completed">Completed</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{projectToEdit ? 'Update Project' : 'Save Project & Auto-Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
