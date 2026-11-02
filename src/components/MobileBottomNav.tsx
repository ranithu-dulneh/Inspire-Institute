import React from 'react';
import { ActiveTab } from '../types';
import { Home, LayoutDashboard, FileText, ShoppingBag, Video, Award, LogIn, Radio } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  cartCount: number;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  action?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onNavigate,
  cartCount,
  isLoggedIn,
  onOpenLogin
}) => {
  // Inside LMS or Admin, adjust mobile tabs
  const tabs: TabItem[] = activeTab === 'admin'
    ? [
        { id: 'admin', label: 'Admin', icon: LayoutDashboard },
        { id: 'home', label: 'Home', icon: Home },
        { id: 'live', label: 'Live', icon: Radio },
        { id: 'lms', label: 'LMS Hub', icon: Award }
      ]
    : activeTab === 'lms'
    ? [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'live', label: 'Live', icon: Radio },
        { id: 'lms', label: 'LMS Hub', icon: LayoutDashboard },
        { id: 'results', label: 'Wall of Fame', icon: Award }
      ]
    : [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'live', label: 'Live', icon: Radio },
        { id: 'past-papers', label: 'Papers', icon: FileText },
        { id: 'videos', label: 'Videos', icon: Video },
        { id: 'lms', label: 'LMS', icon: LayoutDashboard }
      ];

  return (
    <div className="lg:hidden fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto pointer-events-auto">
      <nav className="liquid-glass rounded-full px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/80 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else {
                  onNavigate(tab.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 ${
                isActive 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-blue-600 text-white font-sans text-[9px] flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
