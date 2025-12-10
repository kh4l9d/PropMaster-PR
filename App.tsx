import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Tenants from './components/Tenants';
import Apartments from './components/Apartments';
import Finance from './components/Finance';
import Maintenance from './components/Maintenance';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Contracts from './components/Contracts';
import Sidebar from './components/Sidebar';
import TenantPortal from './components/TenantPortal';
import AIAssistant from './components/AIAssistant';
import { User, AppState, MaintenanceRequest, Transaction, Tenant, Apartment, Contract, ContractTemplate, OwnerSettings, AuditLogEntry, Report, DeletedRecord } from './types';
import { MOCK_TENANTS, MOCK_APARTMENTS, MOCK_TRANSACTIONS, MOCK_MAINTENANCE, MOCK_CONTRACTS, MOCK_TEMPLATES } from './constants';
import { Menu, Moon, Sun } from 'lucide-react';

const DEFAULT_OWNER_SETTINGS: OwnerSettings = {
  name: 'PropMaster Management',
  location: 'Cairo, Egypt',
  phone: '+20 100 000 0000'
};

const App: React.FC = () => {
  // Safe LocalStorage Retrieval Helper
  const getSafeStorageItem = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.warn(`Failed to parse ${key} from localStorage, using default.`, e);
      return defaultValue;
    }
  };

  const getInitialLanguage = (): 'en' | 'ar' => {
      const lang = localStorage.getItem('appLanguage');
      return (lang === 'en' || lang === 'ar') ? lang : 'en';
  };
  
  const getInitialTheme = (): 'light' | 'dark' => {
      const theme = localStorage.getItem('appTheme');
      return (theme === 'light' || theme === 'dark') ? theme : 'light';
  };

  const [state, setState] = useState<AppState>({
    user: null,
    language: getInitialLanguage(),
    theme: getInitialTheme(),
    ownerSettings: getSafeStorageItem<OwnerSettings>('ownerSettings', DEFAULT_OWNER_SETTINGS),
    auditLog: getSafeStorageItem<AuditLogEntry[]>('auditLog', [])
  });
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const [maintenance, setMaintenance] = useState(MOCK_MAINTENANCE);
  const [apartments, setApartments] = useState(MOCK_APARTMENTS);
  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [templates, setTemplates] = useState<ContractTemplate[]>(MOCK_TEMPLATES);
  
  // Deleted Records Log
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);

  // Reports State (Moved from Reports.tsx)
  const [savedReports, setSavedReports] = useState<Report[]>([
      { id: 'rep-001', name: 'Financial Report - Q1 2023', date: '2023-04-01', size: '2.4 MB', archived: false },
      { id: 'rep-002', name: 'Annual Maintenance Summary', date: '2022-12-31', size: '1.8 MB', archived: false },
      { id: 'rep-003', name: 'Contract Performance Analysis', date: '2023-06-15', size: '3.1 MB', archived: false },
  ]);

  // Apply Dark Mode Class
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('appTheme', state.theme);
  }, [state.theme]);

  // Persist Language
  useEffect(() => {
    localStorage.setItem('appLanguage', state.language);
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = state.language;
  }, [state.language]);

  // Persist Owner Settings
  useEffect(() => {
    localStorage.setItem('ownerSettings', JSON.stringify(state.ownerSettings));
  }, [state.ownerSettings]);

  // Persist Audit Log
  useEffect(() => {
    localStorage.setItem('auditLog', JSON.stringify(state.auditLog));
  }, [state.auditLog]);

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      user: state.user?.name || 'System',
      action,
      details,
      date: new Date().toLocaleString(state.language === 'ar' ? 'ar-EG' : 'en-US')
    };
    setState(prev => ({ ...prev, auditLog: [newLog, ...prev.auditLog] }));
  };

  const recordDeletion = (item: any, type: DeletedRecord['type'], name: string, action: 'Deleted' | 'Archived' = 'Deleted') => {
    const record: DeletedRecord = {
        id: item.id,
        type,
        name,
        action,
        originalData: item,
        date: new Date().toLocaleString(state.language === 'ar' ? 'ar-EG' : 'en-US'),
        user: state.user?.name || 'Admin'
    };
    setDeletedRecords(prev => [record, ...prev]);
  };

  const handleLogin = (user: User) => {
    setState({ ...state, user });
    addAuditLog('Login', `User ${user.name} logged in.`);
  };

  const handleLogout = () => {
    addAuditLog('Logout', `User ${state.user?.name} logged out.`);
    setState({ ...state, user: null });
  };

  // --- Deletion Handlers (with Logging) ---

  const handleDeleteMaintenance = (id: string) => {
    const item = maintenance.find(m => m.id === id);
    if (item) {
        recordDeletion(item, 'Maintenance', `${item.issueType} - ${item.description.substring(0, 20)}...`);
        setMaintenance(prev => prev.filter(m => m.id !== id));
        addAuditLog('Delete Maintenance', `Deleted request ${id}. Moved to Deleted Log.`);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const item = transactions.find(t => t.id === id);
    if (item) {
        recordDeletion(item, 'Transaction', `${item.type} - ${item.amount}`);
        setTransactions(prev => prev.filter(t => t.id !== id));
        addAuditLog('Delete Transaction', `Deleted transaction ${id}. Moved to Deleted Log.`);
    }
  };

  const handleDeleteTenant = (id: string) => {
    const item = tenants.find(t => t.id === id);
    if (!item) return;

    recordDeletion(item, 'Tenant', item.name);

    // Cascading effects (as per requirements)
    setContracts(prev => prev.filter(c => c.tenantId !== id)); // Delete contracts
    setTransactions(prev => prev.filter(t => t.relatedId !== id)); // Delete financial records
    setMaintenance(prev => prev.filter(m => m.tenantId !== id)); // Delete requests
    setApartments(prev => prev.map(a => a.tenantId === id ? { ...a, status: 'vacant', tenantId: undefined } : a)); // Unassign apartment

    setTenants(prev => prev.filter(t => t.id !== id));
    addAuditLog('Delete Tenant', `Deleted tenant ${item.name} and cascaded deletions. Moved to Deleted Log.`);
  };

  const handleDeleteApartment = (id: string) => {
    const item = apartments.find(a => a.id === id);
    if (!item) return;

    recordDeletion(item, 'Apartment', `${item.number} - ${item.building}`);

    // Cascading effects (as per requirements)
    setContracts(prev => prev.filter(c => c.apartmentId !== id)); // Terminate/Delete contracts
    if (item.tenantId) {
       // Typically we wouldn't delete the tenant, but we must update them
       setTenants(prev => prev.map(t => t.id === item.tenantId ? { ...t, apartmentId: undefined } : t));
    }
    setMaintenance(prev => prev.filter(m => m.apartmentId !== id));

    setApartments(prev => prev.filter(a => a.id !== id));
    addAuditLog('Delete Apartment', `Deleted apartment ${item.number} and cascaded deletions. Moved to Deleted Log.`);
  };

  const handleDeleteContract = (id: string) => {
    const item = contracts.find(c => c.id === id);
    if (!item) return;

    recordDeletion(item, 'Contract', `Contract ${id} (Tenant: ${item.tenantId})`);

    setContracts(prev => prev.filter(c => c.id !== id));
    if (item.status === 'active') {
       // Update linked entities if needed
    }
    addAuditLog('Delete Contract', `Deleted contract ${id}. Moved to Deleted Log.`);
  };

  const handleDeleteReport = (id: string) => {
    const item = savedReports.find(r => r.id === id);
    if (item) {
        recordDeletion(item, 'Report', item.name);
        setSavedReports(prev => prev.filter(r => r.id !== id));
        addAuditLog('Delete Report', `Deleted report ${item.name}. Moved to Deleted Log.`);
    }
  };

  // --- Restoration Handlers ---

  const handleRestoreDeleted = (record: DeletedRecord) => {
      // 1. Restore item to respective state
      switch(record.type) {
          case 'Tenant':
              setTenants(prev => [...prev, { ...record.originalData, status: 'active' }]);
              break;
          case 'Apartment':
              setApartments(prev => [...prev, { ...record.originalData, status: 'vacant' }]); // Default to vacant on restore
              break;
          case 'Contract':
              setContracts(prev => [...prev, { ...record.originalData, status: 'active' }]);
              break;
          case 'Transaction':
              setTransactions(prev => [...prev, { ...record.originalData, status: 'pending' }]); // Pending review on restore
              break;
          case 'Maintenance':
              setMaintenance(prev => [...prev, { ...record.originalData, status: 'pending' }]);
              break;
          case 'Report':
              setSavedReports(prev => [...prev, record.originalData]);
              break;
      }
      // 2. Remove from log
      setDeletedRecords(prev => prev.filter(r => r.id !== record.id));
      addAuditLog('Restore', `Restored ${record.type}: ${record.name} from Deleted Log.`);
  };

  // For Archived Records, they are just items with status='archived' (except reports which use boolean)
  const handleRestoreArchived = (record: DeletedRecord) => {
      switch(record.type) {
          case 'Tenant':
              setTenants(prev => prev.map(t => t.id === record.id ? { ...t, status: 'active' } : t));
              break;
          case 'Apartment':
              setApartments(prev => prev.map(a => a.id === record.id ? { ...a, status: 'vacant' } : a));
              break;
          case 'Contract':
              setContracts(prev => prev.map(c => c.id === record.id ? { ...c, status: 'active' } : c));
              break;
          case 'Transaction':
              setTransactions(prev => prev.map(t => t.id === record.id ? { ...t, status: 'pending' } : t));
              break;
          case 'Maintenance':
              setMaintenance(prev => prev.map(m => m.id === record.id ? { ...m, status: 'pending' } : m));
              break;
          case 'Report':
              setSavedReports(prev => prev.map(r => r.id === record.id ? { ...r, archived: false } : r));
              break;
      }
      addAuditLog('Restore Archive', `Restored ${record.type}: ${record.name} from Archive.`);
  };

  // --- Archive Handlers ---
  
  const handleArchiveReport = (id: string) => {
      setSavedReports(prev => prev.map(r => r.id === id ? { ...r, archived: true } : r));
      addAuditLog('Archive Report', `Archived report ${id}.`);
  };

  // ... Other standard handlers ...
  const handleAddMaintenance = (req: MaintenanceRequest) => { setMaintenance(prev => [req, ...prev]); addAuditLog('Add Maintenance', `Added ${req.issueType}.`); };
  const handleUpdateMaintenance = (updatedReq: MaintenanceRequest) => { setMaintenance(prev => prev.map(m => m.id === updatedReq.id ? updatedReq : m)); addAuditLog('Update Maintenance', `Updated ${updatedReq.id}.`); };
  const handleArchiveMaintenance = (id: string) => { setMaintenance(prev => prev.map(m => m.id === id ? { ...m, status: 'archived' } : m)); addAuditLog('Archive Maintenance', `Archived ${id}.`); };

  const handleAddTransaction = (t: Transaction) => { setTransactions(prev => [t, ...prev]); addAuditLog('Add Transaction', `Added ${t.type} ${t.amount}.`); };
  const handleEditTransaction = (t: Transaction) => { setTransactions(prev => prev.map(tx => tx.id === t.id ? t : tx)); addAuditLog('Update Transaction', `Updated ${t.id}.`); };
  const handleArchiveTransaction = (id: string) => { setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'archived' } : t)); addAuditLog('Archive Transaction', `Archived ${id}.`); };

  const handleAddTenant = (t: Tenant) => { setTenants(prev => [...prev, t]); addAuditLog('Add Tenant', `Added ${t.name}.`); };
  const handleUpdateTenant = (t: Tenant) => { setTenants(prev => prev.map(x => x.id === t.id ? t : x)); addAuditLog('Update Tenant', `Updated ${t.name}.`); };
  const handleArchiveTenant = (id: string) => { setTenants(prev => prev.map(t => t.id === id ? { ...t, status: 'archived' } : t)); addAuditLog('Archive Tenant', `Archived ${id}.`); };

  const handleAddApartment = (a: Apartment) => { setApartments(prev => [...prev, a]); addAuditLog('Add Apartment', `Added ${a.number}.`); };
  const handleUpdateApartment = (a: Apartment) => { setApartments(prev => prev.map(x => x.id === a.id ? a : x)); addAuditLog('Update Apartment', `Updated ${a.number}.`); };
  const handleArchiveApartment = (id: string) => { setApartments(prev => prev.map(a => a.id === id ? { ...a, status: 'archived' } : a)); addAuditLog('Archive Apartment', `Archived ${id}.`); };

  const handleAddContract = (c: Contract) => { setContracts(prev => [...prev, c]); addAuditLog('Add Contract', `Added Contract ${c.id}.`); };
  const handleUpdateContract = (c: Contract) => { setContracts(prev => prev.map(x => x.id === c.id ? c : x)); addAuditLog('Update Contract', `Updated ${c.id}.`); };
  const handleArchiveContract = (id: string) => { setContracts(prev => prev.map(c => c.id === id ? { ...c, status: 'archived' } : c)); addAuditLog('Archive Contract', `Archived ${id}.`); };
  const handleAddTemplate = (t: ContractTemplate) => { setTemplates(prev => [...prev, t]); };
  const handleUpdateOwnerSettings = (s: OwnerSettings) => { setState(prev => ({ ...prev, ownerSettings: s })); addAuditLog('Settings', 'Updated owner settings.'); };

  const toggleTheme = () => { setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' })); };
  const toggleLanguage = () => { setState(prev => ({ ...prev, language: prev.language === 'en' ? 'ar' : 'en' })); };

  // Gather Archived Records for Settings View from current state
  const archivedRecords: DeletedRecord[] = [
      ...tenants.filter(t => t.status === 'archived').map(t => ({ id: t.id, type: 'Tenant' as const, name: t.name, action: 'Archived' as const, originalData: t, date: new Date().toLocaleString(), user: 'Admin' })),
      ...apartments.filter(a => a.status === 'archived').map(a => ({ id: a.id, type: 'Apartment' as const, name: `${a.number} - ${a.building}`, action: 'Archived' as const, originalData: a, date: new Date().toLocaleString(), user: 'Admin' })),
      ...contracts.filter(c => c.status === 'archived').map(c => ({ id: c.id, type: 'Contract' as const, name: `Contract ${c.id}`, action: 'Archived' as const, originalData: c, date: new Date().toLocaleString(), user: 'Admin' })),
      ...transactions.filter(t => t.status === 'archived').map(t => ({ id: t.id, type: 'Transaction' as const, name: `${t.type} - ${t.amount}`, action: 'Archived' as const, originalData: t, date: new Date().toLocaleString(), user: 'Admin' })),
      ...maintenance.filter(m => m.status === 'archived').map(m => ({ id: m.id, type: 'Maintenance' as const, name: m.issueType, action: 'Archived' as const, originalData: m, date: new Date().toLocaleString(), user: 'Admin' })),
      ...savedReports.filter(r => r.archived).map(r => ({ id: r.id, type: 'Report' as const, name: r.name, action: 'Archived' as const, originalData: r, date: new Date().toLocaleString(), user: 'Admin' })),
  ];

  const getAIContext = () => {
    return {
      currentUser: state.user?.name,
      currentRole: state.user?.role,
      ownerInfo: state.ownerSettings,
      summary: {
         totalTenants: tenants.length,
         activeTenants: tenants.filter(t => t.status === 'active').length,
         totalApartments: apartments.length,
         vacantApartments: apartments.filter(a => a.status === 'vacant').length,
         overdueInvoices: transactions.filter(t => t.type === 'invoice' && t.status === 'overdue').length,
         pendingMaintenance: maintenance.filter(m => m.status === 'pending').length,
         totalRevenue: transactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0),
         activeContracts: contracts.filter(c => c.status === 'active').length
      },
      currentView: currentView
    };
  };

  const getViewTitle = (view: string) => {
    if (state.language === 'en') return view;
    switch(view) {
        case 'dashboard': return 'لوحة التحكم';
        case 'tenants': return 'المستأجرين';
        case 'apartments': return 'الشقق';
        case 'finance': return 'المالية';
        case 'maintenance': return 'الصيانة';
        case 'reports': return 'التقارير';
        case 'settings': return 'الإعدادات';
        case 'contracts': return 'العقود';
        default: return view;
    }
  };

  if (!state.user) {
    return (
      <Login 
        onLogin={handleLogin} 
        language={state.language} 
        theme={state.theme} 
        onThemeToggle={toggleTheme} 
        onLanguageToggle={toggleLanguage}
      />
    );
  }

  if (state.user.role === 'tenant') {
    return (
      <>
        <TenantPortal 
          user={state.user} 
          transactions={transactions}
          maintenance={maintenance}
          onUpdateTransaction={handleEditTransaction}
          onAddMaintenance={handleAddMaintenance}
          onLogout={handleLogout} 
          language={state.language} 
          theme={state.theme} 
          onThemeToggle={toggleTheme} 
        />
        <AIAssistant language={state.language} contextData={{...getAIContext(), role: 'tenant'}} />
      </>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            transactions={transactions} 
            tenants={tenants} 
            maintenance={maintenance} 
            apartments={apartments}
            contracts={contracts}
            language={state.language} 
            theme={state.theme} 
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onUpdateMaintenance={handleUpdateMaintenance}
            onAddTenant={handleAddTenant}
          />
        );
      case 'tenants':
        return (
          <Tenants 
            tenants={tenants} 
            transactions={transactions}
            maintenance={maintenance}
            onAddTenant={handleAddTenant}
            onUpdateTenant={handleUpdateTenant}
            onArchiveTenant={handleArchiveTenant}
            onDeleteTenant={handleDeleteTenant}
            language={state.language} 
          />
        );
      case 'apartments':
        return (
          <Apartments 
            apartments={apartments} 
            tenants={tenants}
            maintenance={maintenance}
            onAddApartment={handleAddApartment}
            onUpdateApartment={handleUpdateApartment}
            onArchiveApartment={handleArchiveApartment}
            onDeleteApartment={handleDeleteApartment}
            language={state.language} 
          />
        );
      case 'finance':
        return (
          <Finance 
            transactions={transactions} 
            language={state.language} 
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onArchiveTransaction={handleArchiveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            tenants={tenants}
          />
        );
      case 'maintenance':
        return (
          <Maintenance 
            maintenance={maintenance} 
            onUpdateRequest={handleUpdateMaintenance}
            onArchiveRequest={handleArchiveMaintenance}
            onDeleteRequest={handleDeleteMaintenance}
            onAddTransaction={handleAddTransaction}
            language={state.language}
            tenants={tenants}
          />
        );
      case 'reports':
        return (
          <Reports 
            language={state.language} 
            theme={state.theme} 
            ownerSettings={state.ownerSettings}
            savedReports={savedReports}
            onArchiveReport={handleArchiveReport}
            onRestoreReport={(id) => handleRestoreDeleted({ id, type: 'Report', name: 'Restored Report', action: 'Deleted', originalData: null, date: '', user: '' })} // Simplified for report, restore maps to same
            onDeleteReport={handleDeleteReport}
            transactions={transactions}
            tenants={tenants}
          />
        );
      case 'settings':
        return (
          <Settings 
            language={state.language} 
            onLanguageChange={(l) => setState({...state, language: l})} 
            theme={state.theme} 
            onThemeChange={(t) => setState({...state, theme: t})}
            ownerSettings={state.ownerSettings}
            onUpdateOwnerSettings={handleUpdateOwnerSettings}
            auditLog={state.auditLog}
            deletedRecords={deletedRecords}
            archivedRecords={archivedRecords}
            onRestoreDeleted={handleRestoreDeleted}
            onRestoreArchived={handleRestoreArchived}
          />
        );
      case 'contracts':
        return (
          <Contracts 
            contracts={contracts} 
            tenants={tenants} 
            apartments={apartments} 
            templates={templates}
            transactions={transactions}
            language={state.language} 
            onAddTransaction={handleAddTransaction}
            onAddContract={handleAddContract}
            onUpdateContract={handleUpdateContract}
            onArchiveContract={handleArchiveContract}
            onDeleteContract={handleDeleteContract}
            onAddTemplate={handleAddTemplate}
            ownerSettings={state.ownerSettings}
          />
        );
      default:
        return <Dashboard transactions={transactions} tenants={tenants} maintenance={maintenance} language={state.language} theme={state.theme} />;
    }
  };

  const sidebarContainerClass = `
    fixed inset-y-0 z-30 bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
    ${state.language === 'ar' ? 'right-0' : 'left-0'}
    ${isSidebarOpen ? 'translate-x-0' : (state.language === 'ar' ? 'translate-x-full' : '-translate-x-full')}
  `;

  return (
    <div className={`min-h-screen flex bg-gray-50 dark:bg-gray-900 ${state.language === 'ar' ? 'font-cairo' : 'font-sans'} text-gray-900 dark:text-gray-100 transition-colors duration-200`} dir={state.language === 'ar' ? 'rtl' : 'ltr'}>
      
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white dark:bg-gray-800 p-4 shadow-sm z-20 flex items-center justify-between border-b dark:border-gray-700">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-200">
          <Menu />
        </button>
        <span className="font-bold text-lg text-primary">PropMaster</span>
        <button onClick={toggleTheme} className="p-1 text-gray-600 dark:text-gray-300">
            {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className={sidebarContainerClass}>
        <Sidebar 
          currentView={currentView} 
          onChangeView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} 
          language={state.language}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex-1 lg:ml-0 mt-16 lg:mt-0 transition-all overflow-y-auto h-screen w-full relative">
         <div className="hidden lg:flex justify-between items-center p-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10 shadow-sm transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{getViewTitle(currentView)}</h2>
            <div className="flex items-center gap-4">
               <button 
                 onClick={toggleTheme}
                 className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                 title={state.language === 'ar' ? 'تغيير المظهر' : 'Toggle Theme'}
               >
                 {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
               </button>

               <button 
                 onClick={toggleLanguage}
                 className="px-3 py-1 border dark:border-gray-600 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
               >
                 {state.language === 'en' ? 'عربي' : 'English'}
               </button>
               <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
               <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {state.user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">{state.user.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {state.language === 'ar' && state.user.role === 'manager' ? 'مدير عقار' : 
                         state.language === 'ar' && state.user.role === 'admin' ? 'مشرف' : 
                         state.user.role}
                      </span>
                  </div>
               </div>
            </div>
         </div>
         
         {renderContent()}

         <AIAssistant language={state.language} contextData={getAIContext()} />
      </div>
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default App;