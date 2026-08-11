import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  TrendingUp,
  CreditCard,
  Users,
  History
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'projects'
  | 'clients'
  | 'income'
  | 'expenses'
  | 'team'
  | 'transactions';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'clients', label: 'Clients', icon: <Building2 className="w-5 h-5" /> },
    { id: 'income', label: 'Income', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" /> },
    { id: 'transactions', label: 'Tx History', icon: <History className="w-5 h-5" /> }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="max-w-md mx-auto flex justify-between items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-all relative ${
                isActive ? 'text-primary font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-full transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
