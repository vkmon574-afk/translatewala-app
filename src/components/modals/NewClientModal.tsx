import React, { useState } from 'react';
import { Client } from '../../types';
import { X, Building2, Save } from 'lucide-react';

interface NewClientModalProps {
  client?: Client | null;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  onSaveAndCreateProject?: (clientName: string) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  client,
  onClose,
  onSave,
  onSaveAndCreateProject
}) => {
  const [name, setName] = useState(client?.name || '');
  const [company, setCompany] = useState(client?.company || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [notes, setNotes] = useState(client?.notes || '');

  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: client?.id,
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim()
    });

    onClose();
  };

  const handleSaveAndProject = () => {
    if (!name.trim()) return;

    const trimmedName = name.trim();
    onSave({
      id: client?.id,
      name: trimmedName,
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim()
    });

    onClose();
    if (onSaveAndCreateProject) {
      onSaveAndCreateProject(trimmedName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">
                {client ? 'Edit Client / Customer' : 'Add New Client / Customer'}
              </h3>
              <p className="text-xs text-blue-100">Client billing profile & contacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSaveOnly} className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client / Person Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Qatar Media or Ahmed Al-Thani"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company / Agency Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Qatar Media Group WLL"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@qatarmedia.qa"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+974 4400 1234"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Special Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requires certified Arabic translations with stamp"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{client ? 'Save Changes' : 'Save Customer'}</span>
              </button>
            </div>

            {!client && (
              <button
                type="button"
                onClick={handleSaveAndProject}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Save & Create Project Now →</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
