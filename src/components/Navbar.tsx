import React from 'react';
import { Currency, Owner } from '../types';
import { UserCheck, RefreshCw, Wifi, WifiOff, DollarSign, IndianRupee, FolderPlus } from 'lucide-react';

interface NavbarProps {
  activeOwner: Owner;
  onOwnerChange: (owner: Owner) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  isOnline: boolean;
  isLiveSynced: boolean;
  isSyncing: boolean;
  pendingCount: number;
  onFlushQueue: () => void;
  activeTabTitle: string;
  onOpenAddProject?: () => void;
  onOpenGoogleSheets?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeOwner,
  onOwnerChange,
  currency,
  onCurrencyChange,
  isOnline,
  isLiveSynced,
  isSyncing,
  pendingCount,
  onFlushQueue,
  activeTabTitle,
  onOpenAddProject,
  onOpenGoogleSheets
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 select-none">
            {/* Custom SVG/styled TranslateWala Logo */}
            <div className="flex items-baseline font-black text-2xl tracking-tight leading-none">
              <span className="text-red-600 font-extrabold flex items-baseline">
                Tr
                <span className="relative inline-flex flex-col items-center mx-[1px]">
                  <span className="text-[10px] text-red-600 font-black leading-none -mb-0.5">文</span>
                  <span className="text-blue-600 font-black text-2xl leading-none">A</span>
                </span>
                nslate
              </span>
              <span className="text-blue-600 font-black text-2xl ml-0.5">Wala</span>
            </div>
          </div>

          <span className="hidden md:inline-block text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            FINANCIAL OS
          </span>
        </div>

        {/* Sync Status Badge & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenGoogleSheets && (
            <button
              onClick={onOpenGoogleSheets}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              title="Google Sheets Data Sync"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Google Sheets</span>
            </button>
          )}

          {onOpenAddProject && (
            <button
              onClick={onOpenAddProject}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              title="Create New Project"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ New Project</span>
              <span className="sm:hidden">+ Proj</span>
            </button>
          )}

          {/* Active Sync Status Badge */}
          <button
            onClick={onFlushQueue}
            title={
              !isOnline
                ? `Offline mode. ${pendingCount} changes stored locally.`
                : isSyncing
                ? 'Syncing changes with server...'
                : isLiveSynced
                ? 'Real-time sync active across all devices.'
                : 'Reconnecting to server...'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              !isOnline
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : isSyncing
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : isLiveSynced
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Offline ({pendingCount})</span>
                <span className="sm:hidden">Off</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span className="hidden sm:inline">Syncing...</span>
              </>
            ) : isLiveSynced ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="hidden sm:inline">Live Synced</span>
                <span className="sm:hidden">Live</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Connecting</span>
              </>
            )}
          </button>

          {/* Currency Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onCurrencyChange('INR')}
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-0.5 transition-all ${
                currency === 'INR'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Indian Rupee (₹)"
            >
              <IndianRupee className="w-3 h-3" />
              <span>₹</span>
            </button>
            <button
              onClick={() => onCurrencyChange('USD')}
              className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-0.5 transition-all ${
                currency === 'USD'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="US Dollar ($)"
            >
              <DollarSign className="w-3 h-3" />
              <span>$</span>
            </button>
          </div>

          {/* Active Owner Role Selector */}
          <div className="relative flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200">
            <button
              onClick={() => onOwnerChange('Shafiulla')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                activeOwner === 'Shafiulla'
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Log payments as Shafiulla"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Shafiulla</span>
            </button>
            <button
              onClick={() => onOwnerChange('Mohiyuddin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                activeOwner === 'Mohiyuddin'
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Log payments as Mohiyuddin"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Mohiyuddin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
