
import React, { useState, useMemo } from 'react';
import { Transaction, OwnerSettings, Report, Apartment, Tenant } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Download, Calendar, Filter, User, FileText, Trash2, Archive, RefreshCw } from 'lucide-react';

interface ReportsProps {
  language: 'en' | 'ar';
  theme?: 'light' | 'dark';
  ownerSettings?: OwnerSettings;
  savedReports: Report[];
  onArchiveReport: (id: string) => void;
  onRestoreReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  // New props for filtering logic
  apartments?: Apartment[];
  tenants?: Tenant[];
  transactions?: Transaction[];
}

const Reports: React.FC<ReportsProps> = ({ 
    language, theme = 'light', ownerSettings, 
    savedReports, onArchiveReport, onRestoreReport, onDeleteReport,
    apartments = [], tenants = [], transactions = []
}) => {
  const [showArchived, setShowArchived] = useState(false);
  
  // Filtering States
  const [buildingFilter, setBuildingFilter] = useState('All');
  const [roomsFilter, setRoomsFilter] = useState('All');
  const [tenantStatusFilter, setTenantStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // 1. Filter Apartments based on Building and Rooms
  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => {
        const matchesBuilding = buildingFilter === 'All' || apt.building === buildingFilter;
        const matchesRooms = roomsFilter === 'All' || apt.rooms.toString() === roomsFilter;
        return matchesBuilding && matchesRooms;
    });
  }, [apartments, buildingFilter, roomsFilter]);

  const filteredAptIds = new Set(filteredApartments.map(a => a.id));
  const uniqueBuildings = Array.from(new Set(apartments.map(a => a.building)));
  const uniqueRooms = Array.from(new Set(apartments.map(a => a.rooms))).sort((a,b) => a - b);

  // 2. Filter Tenants based on Status and Linked Apartment
  const filteredTenants = useMemo(() => {
      return tenants.filter(t => {
          const matchesStatus = tenantStatusFilter === 'All' || t.status === tenantStatusFilter.toLowerCase();
          const matchesApt = !t.apartmentId || filteredAptIds.has(t.apartmentId); // Include tenants if their apartment is in list (or if history/no apt, loosely include)
          return matchesStatus && matchesApt;
      });
  }, [tenants, tenantStatusFilter, filteredAptIds]);

  const filteredTenantIds = new Set(filteredTenants.map(t => t.id));

  // 3. Filter Transactions based on Date Range and Filtered Tenants/Apartments
  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          // Transaction logic: usually linked to tenantId (relatedId).
          // If relatedId is a tenant in filtered list, include.
          // OR if type is 'expense'/other and not linked to specific tenant, we might include if 'All' filters.
          // For strict reporting, let's filter by related Tenant.
          
          const isRelatedToFilteredTenant = t.relatedId && filteredTenantIds.has(t.relatedId);
          // Allow general expenses if filters are broad, otherwise strict
          const allowGeneral = buildingFilter === 'All' && roomsFilter === 'All' && tenantStatusFilter === 'All';
          
          if (!isRelatedToFilteredTenant && !allowGeneral && t.relatedId) return false;

          const matchesDate = 
            (!dateRange.start || t.date >= dateRange.start) && 
            (!dateRange.end || t.date <= dateRange.end);
            
          return matchesDate;
      });
  }, [transactions, filteredTenantIds, dateRange, buildingFilter, roomsFilter, tenantStatusFilter]);

  // Calculate Summary Stats
  const summary = useMemo(() => {
      const income = filteredTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
      const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netProfit = income - expenses;
      
      // Occupancy Rate: based on Filtered Apartments
      const totalApts = filteredApartments.length;
      const occupiedApts = filteredApartments.filter(a => a.status === 'occupied').length;
      const occupancyRate = totalApts > 0 ? Math.round((occupiedApts / totalApts) * 100) : 0;

      return { income, expenses, netProfit, occupancyRate };
  }, [filteredTransactions, filteredApartments]);

  // Generate Chart Data from Filtered Transactions
  const chartData = useMemo(() => {
      // Group by Month (Last 6 months usually, or based on date range)
      const dataMap = new Map<string, { revenue: number, expense: number }>();
      
      filteredTransactions.forEach(t => {
          const date = new Date(t.date);
          const key = language === 'ar' 
            ? date.toLocaleString('ar-EG', { month: 'short' }) 
            : date.toLocaleString('en-US', { month: 'short' });
          
          if (!dataMap.has(key)) dataMap.set(key, { revenue: 0, expense: 0 });
          const entry = dataMap.get(key)!;

          if (t.type === 'payment') entry.revenue += t.amount;
          if (t.type === 'expense') entry.expense += t.amount;
      });

      // Convert Map to Array and sort? (Simplified for now, using existing mock structure if empty)
      if (dataMap.size === 0) {
           return [
            { name: language === 'ar' ? 'يناير' : 'Jan', revenue: 0, expense: 0 },
            { name: language === 'ar' ? 'فبراير' : 'Feb', revenue: 0, expense: 0 },
            { name: language === 'ar' ? 'مارس' : 'Mar', revenue: 0, expense: 0 },
          ];
      }

      return Array.from(dataMap.entries()).map(([name, data]) => ({ name, ...data }));
  }, [filteredTransactions, language]);

  const handleArchiveClick = (id: string) => {
      const msg = language === 'ar' ? 'هل أنت متأكد من أرشفة هذا التقرير؟' : 'Are you sure you want to archive this report?';
      if(window.confirm(msg)) {
          onArchiveReport(id);
      }
  };

  const handleDeleteClick = (id: string) => {
      if(window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا التقرير المحفوظ نهائياً؟' : 'Are you sure you want to permanently delete this saved report?')) {
          onDeleteReport(id);
      }
  };

  const visibleReports = savedReports.filter(r => !!r.archived === showArchived);

  const axisColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const tooltipStyle = {
      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', 
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', 
      color: theme === 'dark' ? '#fff' : '#000' 
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {language === 'ar' ? 'التقارير والتحليلات' : 'Reports & Analytics'}
            </h2>
            {ownerSettings && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <User size={12} /> {ownerSettings.name} | {ownerSettings.location}
                </p>
            )}
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                <Calendar size={16} />
                <span>{language === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700">
                <Download size={16} />
                <span>{language === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
            </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4 transition-colors">
          <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'المبنى' : 'Building'}</label>
              <select 
                  className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white"
                  value={buildingFilter}
                  onChange={(e) => setBuildingFilter(e.target.value)}
              >
                  <option value="All">{language === 'ar' ? 'كل المباني' : 'All Buildings'}</option>
                  {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
          </div>
          <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'عدد الغرف' : 'Rooms'}</label>
              <select 
                  className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white"
                  value={roomsFilter}
                  onChange={(e) => setRoomsFilter(e.target.value)}
              >
                  <option value="All">{language === 'ar' ? 'الكل' : 'All'}</option>
                  {uniqueRooms.map(r => <option key={r} value={r.toString()}>{r} {language === 'ar' ? 'غرف' : 'Rooms'}</option>)}
              </select>
          </div>
          <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'حالة المستأجر' : 'Tenant Status'}</label>
              <select 
                  className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white"
                  value={tenantStatusFilter}
                  onChange={(e) => setTenantStatusFilter(e.target.value)}
              >
                  <option value="All">{language === 'ar' ? 'الكل' : 'All'}</option>
                  <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                  <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
                  <option value="archived">{language === 'ar' ? 'مؤرشف' : 'Archived'}</option>
              </select>
          </div>
          <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'النطاق الزمني' : 'Date Range'}</label>
              <div className="flex gap-2">
                 <input 
                    type="date" 
                    className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                 />
                 <input 
                    type="date" 
                    className="w-full border dark:border-gray-600 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                 />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{language === 'ar' ? 'الإيرادات مقابل المصروفات' : 'Revenue vs Expenses'}</h3>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                          <XAxis dataKey="name" stroke={axisColor} />
                          <YAxis stroke={axisColor} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Bar dataKey="revenue" fill="#3b82f6" name={language === 'ar' ? 'الإيرادات' : 'Revenue'} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" fill="#ef4444" name={language === 'ar' ? 'المصروفات' : 'Expenses'} radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{language === 'ar' ? 'اتجاه صافي الربح' : 'Net Profit Trend'}</h3>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                           <XAxis dataKey="name" stroke={axisColor} />
                           <YAxis stroke={axisColor} />
                           <Tooltip contentStyle={tooltipStyle} />
                           <Line type="monotone" dataKey="revenue" name={language === 'ar' ? 'صافي الربح' : 'Net Profit'} stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 font-semibold text-gray-700 dark:text-gray-200">
              {language === 'ar' ? 'تقرير الملخص (نتائج الفلتر)' : 'Summary Report (Filtered Results)'}
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'إجمالي الدخل' : 'Total Income'}</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.income.toLocaleString()} EGP</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{summary.expenses.toLocaleString()} EGP</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'صافي الربح' : 'Net Profit'}</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">{summary.netProfit.toLocaleString()} EGP</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نسبة الإشغال' : 'Occupancy Rate'}</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{summary.occupancyRate}%</p>
              </div>
          </div>
      </div>

      {/* Saved Reports Section with Delete/Archive Capability */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 font-semibold text-gray-700 dark:text-gray-200 flex justify-between items-center">
              <span>{showArchived ? (language === 'ar' ? 'التقارير المؤرشفة' : 'Archived Reports') : (language === 'ar' ? 'التقارير المحفوظة' : 'Saved Reports')}</span>
              <button 
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-blue-600 hover:underline"
              >
                  {showArchived 
                    ? (language === 'ar' ? 'عرض النشطة' : 'View Active') 
                    : (language === 'ar' ? 'عرض الأرشيف' : 'View Archive')}
              </button>
          </div>
          <div className="p-0">
              {visibleReports.length > 0 ? (
                  <div className="divide-y dark:divide-gray-700">
                      {visibleReports.map(report => (
                          <div key={report.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                                      <FileText size={20} />
                                  </div>
                                  <div>
                                      <p className="font-medium text-gray-800 dark:text-white">{report.name}</p>
                                      <p className="text-xs text-gray-500">{report.date} • {report.size}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title={language === 'ar' ? 'تحميل' : 'Download'}>
                                      <Download size={18} />
                                  </button>
                                  
                                  {report.archived ? (
                                      <button 
                                        onClick={() => onRestoreReport(report.id)}
                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                        title={language === 'ar' ? 'استعادة' : 'Restore'}
                                      >
                                          <RefreshCw size={18} />
                                      </button>
                                  ) : (
                                      <button 
                                        onClick={() => handleArchiveClick(report.id)}
                                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                        title={language === 'ar' ? 'أرشفة' : 'Archive'}
                                      >
                                          <Archive size={18} />
                                      </button>
                                  )}

                                  <button 
                                    onClick={() => handleDeleteClick(report.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                                    title={language === 'ar' ? 'حذف' : 'Delete'}
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 italic">
                      {language === 'ar' ? 'لا توجد تقارير في هذه القائمة' : 'No reports in this list'}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Reports;
