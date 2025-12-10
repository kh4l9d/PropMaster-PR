
import React from 'react';
import { LayoutDashboard, Users, Home, DollarSign, Wrench, BarChart3, Settings, LogOut, FileText } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  language: 'en' | 'ar';
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, language, onLogout }) => {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';
  
  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'tenants', label: t.tenants, icon: Users },
    { id: 'apartments', label: t.apartments, icon: Home },
    { id: 'contracts', label: t.contracts, icon: FileText },
    { id: 'finance', label: t.finance, icon: DollarSign },
    { id: 'maintenance', label: t.maintenance, icon: Wrench },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 h-screen shadow-md flex flex-col border-r dark:border-gray-700 transition-colors duration-200">
      <div className="p-6 flex items-center justify-center border-b dark:border-gray-700 h-[73px]">
        <div className="w-8 h-8 bg-primary rounded-lg mx-2 shadow-sm flex items-center justify-center text-white font-bold">P</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">PropMaster</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 dark:bg-gray-700 text-primary dark:text-blue-400 font-semibold shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={20} className={`${isRtl ? 'ml-3' : 'mr-3'} ${isActive ? 'text-primary dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <button 
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        >
          <LogOut size={20} className={isRtl ? 'ml-3' : 'mr-3'} />
          <span className="font-medium text-sm">{t.logout}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;