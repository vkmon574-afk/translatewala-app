import React, { useState } from 'react';
import { AppState } from '../../types';
import { X, Download, Copy, Check, ExternalLink, RefreshCw, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface GoogleSheetsSyncModalProps {
  state: AppState;
  onClose: () => void;
  onSyncGoogleSheets?: (webhookUrl?: string, autoSync?: boolean) => Promise<any>;
  onClearAllDemoData?: () => Promise<any>;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  state,
  onClose,
  onSyncGoogleSheets,
  onClearAllDemoData
}) => {
  const [copied, setCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => state.googleSheetWebhook || localStorage.getItem('gsheet_webhook') || '');
  const [autoSync, setAutoSync] = useState(() => state.autoSyncGoogleSheets !== false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

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
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${(p.clientName || '').replace(/"/g, '""')}"`,
        `"${p.sourceLang || ''}"`,
        `"${p.targetLang || ''}"`,
        `"${p.workType || ''}"`,
        `"${p.assignedTo || ''}"`,
        p.clientCharge || 0,
        `"${p.clientPaymentStatus || 'Pending'}"`,
        p.employeePayout || 0,
        `"${p.employeePayoutStatus || 'Pending'}"`,
        p.estProfit || 0,
        `"${p.status || ''}"`,
        `"${(p.updatedAt || '').split('T')[0]}"`
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
        p.title || '',
        p.clientName || '',
        p.sourceLang || '',
        p.targetLang || '',
        p.workType || '',
        p.assignedTo || '',
        p.clientCharge || 0,
        p.clientPaymentStatus || 'Pending',
        p.employeePayout || 0,
        p.employeePayoutStatus || 'Pending',
        p.estProfit || 0,
        p.status || ''
      ].join('\t')
    );

    const tsvData = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(tsvData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncNow = async () => {
    localStorage.setItem('gsheet_webhook', webhookUrl);
    if (!onSyncGoogleSheets) return;

    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const result = await onSyncGoogleSheets(webhookUrl, autoSync);
      if (result?.success) {
        setSyncStatus({
          type: 'success',
          message: result.message || `Successfully synced ${state.projects.length} projects to Google Sheets!`
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: result?.message || 'Failed to sync with Google Sheet. Please check the Webhook URL.'
        });
      }
    } catch (e: any) {
      setSyncStatus({
        type: 'error',
        message: e.message || 'Error communicating with Google Sheets.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAllData = async () => {
    if (!onClearAllDemoData) return;
    setClearing(true);
    try {
      await onClearAllDemoData();
      setShowClearConfirm(false);
      setSyncStatus({
        type: 'success',
        message: 'All demo and temporary units cleared! Fresh workspace ready.'
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: 'Failed to clear data.'
      });
    } finally {
      setClearing(false);
    }
  };

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Projects Sheet
    var projSheet = ss.getSheetByName("Projects") || ss.insertSheet("Projects");
    projSheet.clear();
    projSheet.appendRow([
      "Project Title", "Client Name", "Source Lang", "Target Lang", 
      "Work Type", "Assigned Employee", "Client Charge", "Client Payment Status", 
      "Employee Payout", "Employee Payout Status", "Net Profit", "Status", "Updated At"
    ]);
    projSheet.getRange("A1:M1").setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    
    if (data.projects && data.projects.length > 0) {
      var projRows = data.projects.map(function(p) {
        return [
          p.title, p.clientName, p.sourceLang, p.targetLang, 
          p.workType, p.assignedTo, p.clientCharge, p.clientPaymentStatus, 
          p.employeePayout, p.employeePayoutStatus, p.netProfit, p.status, p.updatedAt
        ];
      });
      projSheet.getRange(2, 1, projRows.length, 13).setValues(projRows);
    }
    
    // 2. Financial Ledger Sheet
    var ledgerSheet = ss.getSheetByName("Ledger") || ss.insertSheet("Ledger");
    ledgerSheet.clear();
    ledgerSheet.appendRow(["Date", "Title", "Type", "Category", "Amount", "Status", "Method", "Paid By / Employee", "Ref ID"]);
    ledgerSheet.getRange("A1:I1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
    
    if (data.transactions && data.transactions.length > 0) {
      var txRows = data.transactions.map(function(t) {
        return [
          t.date, t.title, t.type, t.category, t.amount, 
          t.status, t.method, t.paidByOwner || t.employeeName || "", t.referenceId
        ];
      });
      ledgerSheet.getRange(2, 1, txRows.length, 9).setValues(txRows);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "SUCCESS", timestamp: new Date() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl border border-slate-100 relative my-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              📊
            </div>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
              Google Sheets Live Sync
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Google Sheets Data Backend</h3>
          <p className="text-xs text-slate-500 mt-1">
            Automatically save all fresh projects, income payments, and employee payouts directly into your Google Sheet.
          </p>
        </div>

        {syncStatus && (
          <div
            className={`mb-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold ${
              syncStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{syncStatus.message}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Section 1: Google Sheet Live Webhook Auto-Sync */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>⚡ Real-Time Google Sheet Webhook Sync</span>
              </h4>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Auto-Updating
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Paste your Google Apps Script Webhook URL. All new projects, status changes, and payout records will sync immediately into your sheet.
            </p>

            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-bold">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Auto-sync automatically on every new project & payment change</span>
              </label>
            </div>
          </div>

          {/* Section 2: Setup Guide & 1-Click Apps Script Code */}
          <details className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs group">
            <summary className="font-extrabold text-slate-800 cursor-pointer flex items-center justify-between">
              <span>📋 Step-by-Step: How to create Google Sheet Webhook in 1 minute</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 text-slate-600 space-y-2 pt-2 border-t border-slate-200">
              <p>1. Open your <strong>Google Sheet</strong> (or create a new blank one).</p>
              <p>2. In the top menu, click <strong>Extensions &gt; Apps Script</strong>.</p>
              <p>3. Delete any default code and paste the script below:</p>
              <div className="relative">
                <button
                  onClick={handleCopyScript}
                  className="absolute right-2 top-2 bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                  {scriptCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{scriptCopied ? 'Copied Script!' : 'Copy Script'}</span>
                </button>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[10px] font-mono overflow-x-auto max-h-36">
                  {googleAppsScriptCode}
                </pre>
              </div>
              <p>4. Click <strong>Deploy &gt; New deployment</strong>, choose <strong>Web app</strong>.</p>
              <p>5. Set <em>Execute as: Me</em> and <em>Who has access: Anyone</em>.</p>
              <p>6. Click <strong>Deploy</strong> and copy the Web App URL into the box above!</p>
            </div>
          </details>

          {/* Section 3: Direct Clipboard Copy & CSV Download */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Quick Export / Paste into Google Sheets
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Ctrl+V ready</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Copy {state.projects.length} project records directly to your clipboard or download a CSV file.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyTable}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Table Data!' : 'Copy Table Data for Sheet'}</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                title="Download CSV"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>CSV File</span>
              </button>
            </div>
          </div>

          {/* Section 4: Clean Slate / Reset All Demo Units */}
          <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clean Slate & Wipe Demo Units</span>
              </h4>
              <span className="text-[10px] text-rose-700 font-bold">100% Fresh Start</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Permanently clears any demo or sample data so only your real Translatewala projects and accounting entries are tracked.
            </p>

            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-2.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Demo Data & Start Fresh</span>
              </button>
            ) : (
              <div className="bg-white border border-rose-300 p-3 rounded-xl flex flex-col gap-2">
                <p className="text-xs text-rose-900 font-bold">
                  Are you sure? This will delete all sample projects, demo clients, and mock transactions permanently.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAllData}
                    disabled={clearing}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-extrabold transition-all"
                  >
                    {clearing ? 'Clearing...' : 'Yes, Wipe Demo Units'}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
