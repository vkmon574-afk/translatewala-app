import React, { useState } from 'react';
import { AppState } from '../../types';
import { X, Table, Download, Copy, Check, ExternalLink, Sheet } from 'lucide-react';

interface GoogleSheetsSyncModalProps {
  state: AppState;
  onClose: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({ state, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('gsheet_webhook') || '');
  const [savedUrl, setSavedUrl] = useState(false);

  // Generate CSV data for Google Sheets
  const generateCSV = () => {
    const headers = [
      'Project Title',
      'Client Name',
      'Source Lang',
      'Target Lang',
      'Work Type',
      'Assigned Employee',
      'Client Charge (Revenue)',
      'Client Payment Status',
      'Employee Payout',
      'Employee Payout Status',
      'Net Profit',
      'Project Status',
      'Updated Date'
    ].join(',');

    const rows = state.projects.map((p) =>
      [
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.clientName.replace(/"/g, '""')}"`,
        `"${p.sourceLang}"`,
        `"${p.targetLang}"`,
        `"${p.workType}"`,
        `"${p.assignedTo}"`,
        p.clientCharge,
        `"${p.clientPaymentStatus || 'Pending'}"`,
        p.employeePayout || 0,
        `"${p.employeePayoutStatus || 'Pending'}"`,
        p.estProfit,
        `"${p.status}"`,
        `"${p.updatedAt.split('T')[0]}"`
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `translatewala_sheet_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTable = () => {
    const headers = [
      'Project Title',
      'Client Name',
      'Source Lang',
      'Target Lang',
      'Work Type',
      'Assigned Employee',
      'Client Charge',
      'Client Payment Status',
      'Employee Payout',
      'Employee Payout Status',
      'Net Profit',
      'Status'
    ].join('\t');

    const rows = state.projects.map((p) =>
      [
        p.title,
        p.clientName,
        p.sourceLang,
        p.targetLang,
        p.workType,
        p.assignedTo,
        p.clientCharge,
        p.clientPaymentStatus || 'Pending',
        p.employeePayout || 0,
        p.employeePayoutStatus || 'Pending',
        p.estProfit,
        p.status
      ].join('\t')
    );

    const tsvData = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(tsvData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWebhook = () => {
    localStorage.setItem('gsheet_webhook', webhookUrl);
    setSavedUrl(true);
    setTimeout(() => setSavedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              📊
            </div>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
              Google Sheets Integration
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Google Sheets Data Backend Sync</h3>
          <p className="text-xs text-slate-500 mt-1">
            Export or sync your projects, client payments, and employee payouts directly with Google Sheets.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Option 1: Direct Clipboard Copy for Paste into Google Sheets */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Copy Formatted Data for Google Sheets
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Open Google Sheet & Press Ctrl+V</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Copy all {state.projects.length} project records formatted as tab-separated values ready for immediate pasting into Google Sheets.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyTable}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Table for Google Sheets'}</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                title="Download CSV"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Option 2: Live Google Sheet Apps Script Webhook */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1">
              2. Google Apps Script Live Webhook (Optional)
            </h4>
            <p className="text-xs text-slate-600 mb-2">
              Enter your Google Sheet Apps Script URL to sync live project updates straight into your sheet automatically.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
              />
              <button
                onClick={handleSaveWebhook}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                {savedUrl ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
