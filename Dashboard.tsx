import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Bell, ArrowUpRight, ArrowDownRight, FileText, DollarSign, Plus, UserPlus, X, Save, ArrowDown, Calendar, User, Home, AlertCircle, Clock, CheckCircle, Smartphone, CreditCard, ExternalLink, Wrench } from 'lucide-react';
import { Transaction, Tenant, MaintenanceRequest, Apartment, Contract, Vendor } from '../types';
import { MOCK_VENDORS } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  tenants: Tenant[];
  maintenance: MaintenanceRequest[];
  apartments?: Apartment[];
  contracts?: Contract[];
  language: 'en' | 'ar';
  theme?: 'light' | 'dark';
  onAddTransaction?: (t: Transaction) => void;
  onEditTransaction?: (t: Transaction) => void;
  onAddTenant?: (t: Tenant) => void;
  onUpdateMaintenance?: (m: MaintenanceRequest) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<DashboardProps> = ({ 
    transactions, 
    tenants, 
    maintenance, 
    apartments = [],
    contracts = [],
    language, 
    theme = 'light',
    onAddTransaction,
    onEditTransaction,
    onAddTenant,
    onUpdateMaintenance
}) => {
  const [activeModal, setActiveModal] = useState<'invoice' | 'payment' | 'expense' | 'tenant' | null>(null);
  
  // Payment Review State
  const [selectedReviewPayment, setSelectedReviewPayment] = useState<Transaction | null>(null);

  // Maintenance Review State
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRequest | null>(null);

  // Quick Action Form State
  const [txForm, setTxForm] = useState<Partial<Transaction>>({ 
      amount: 0, 
      description: '', 
      relatedId: '',
      date: new Date().toISOString().split('T')[0],
      category: ''
  });
  
  const [tenantForm, setTenantForm] = useState<Partial<Tenant>>({ 
      name: '', 
      phone: '', 
      email: '',
      apartmentId: '',
      leaseStart: new Date().toISOString().split('T')[0],
      leaseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  const totalInvoices = transactions.filter(t => t.type === 'invoice').length;
  const overdueInvoicesCount = transactions.filter(t => t.type === 'invoice' && t.status === 'overdue').length;
  const totalReceived = transactions.filter(t => t.type === 'payment').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutstanding = transactions.filter(t => t.type === 'invoice' && t.status === 'unpaid').reduce((acc, curr) => acc + curr.amount, 0);
  
  // Real Notifications Logic
  const overdueInvoices = transactions.filter(t => t.type === 'invoice' && t.status === 'overdue');
  
  // Pending Reviews (Payments submitted by tenants)
  const pendingPayments = transactions.filter(t => t.status === 'pending');

  // New Maintenance Requests (submitted by tenants)
  const newMaintenanceRequests = maintenance.filter(m => m.status === 'pending');

  const expiringContracts = contracts.filter(c => {
      if (c.status !== 'active') return false;
      const today = new Date();
      const expirationDate = new Date(c.endDate);
      const diffTime = expirationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
  });

  // Combine notifications
  const notifications = [
      ...pendingPayments.map(t => ({
          id: t.id,
          type: 'pending_review',
          message: language === 'ar'
             ? `قام المستأجر ${tenants.find(ten => ten.id === t.relatedId)?.name || 'غير معروف'} بإرسال إيصال دفع. يرجى المراجعة.`
             : `Tenant ${tenants.find(ten => ten.id === t.relatedId)?.name || 'Unknown'} submitted a payment receipt. Please review.`,
          time: t.date,
          data: t
      })),
      ...newMaintenanceRequests.map(m => ({
          id: m.id,
          type: 'new_maintenance',
          message: language === 'ar'
             ? `طلب صيانة جديد من ${tenants.find(ten => ten.id === m.tenantId)?.name || 'مستأجر'} - ${m.issueType}`
             : `New maintenance request from ${tenants.find(ten => ten.id === m.tenantId)?.name || 'Tenant'} - ${m.issueType}`,
          time: m.dateReported,
          data: m
      })),
      ...overdueInvoices.map(inv => ({
          id: inv.id,
          type: 'overdue',
          message: language === 'ar' 
            ? `إيجار مستحق للمستأجر ${tenants.find(t => t.id === inv.relatedId)?.name || 'غير معروف'}` 
            : `Rent overdue for tenant ${tenants.find(t => t.id === inv.relatedId)?.name || 'Unknown'}`,
          time: inv.date,
          data: inv
      })),
      ...expiringContracts.map(c => ({
          id: c.id,
          type: 'expiring',
          message: language === 'ar'
            ? `عقد الشقة ${apartments.find(a => a.id === c.apartmentId)?.number || 'N/A'} ينتهي في ${c.endDate}`
            : `Contract for Apt ${apartments.find(a => a.id === c.apartmentId)?.number || 'N/A'} expires on ${c.endDate}`,
          time: new Date().toISOString().split('T')[0],
          data: c
      }))
  ].slice(0, 8); // Show top 8

  // Unpaid invoices for payment linking
  const unpaidInvoicesList = transactions.filter(t => t.type === 'invoice' && (t.status === 'unpaid' || t.status === 'overdue'));

  // Translate Chart Data Labels if Arabic
  const expenseData = [
    { name: language === 'ar' ? 'صيانة' : 'Repairs', value: 400 },
    { name: language === 'ar' ? 'مرافق' : 'Utilities', value: 300 },
    { name: language === 'ar' ? 'إدارة' : 'Mgmt Fees', value: 300 },
    { name: language === 'ar' ? 'أخرى' : 'Other', value: 200 },
  ];

  const cashFlowData = [
    { name: language === 'ar' ? 'يناير' : 'Jan', Income: 4000, Expense: 2400 },
    { name: language === 'ar' ? 'فبراير' : 'Feb', Income: 3000, Expense: 1398 },
    { name: language === 'ar' ? 'مارس' : 'Mar', Income: 2000, Expense: 9800 },
    { name: language === 'ar' ? 'أبريل' : 'Apr', Income: 2780, Expense: 3908 },
    { name: language === 'ar' ? 'مايو' : 'May', Income: 1890, Expense: 4800 },
    { name: language === 'ar' ? 'يونيو' : 'Jun', Income: 2390, Expense: 3800 },
  ];

  const handleQuickAction = (type: 'invoice' | 'payment' | 'expense' | 'tenant') => {
      setActiveModal(type);
      // Reset forms
      setTxForm({ 
          amount: 0, 
          description: '', 
          relatedId: '', 
          date: new Date().toISOString().split('T')[0],
          category: ''
      });
      setTenantForm({ 
          name: '', 
          phone: '', 
          email: '',
          apartmentId: '',
          leaseStart: new Date().toISOString().split('T')[0],
          leaseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      });
  };

  const handleLinkInvoice = (invoiceId: string) => {
      const invoice = transactions.find(t => t.id === invoiceId);
      if (invoice) {
          setTxForm(prev => ({
              ...prev,
              amount: invoice.amount,
              description: language === 'ar' ? `دفعة للفاتورة ${invoice.description}` : `Payment for ${invoice.description}`,
              relatedId: invoice.relatedId
          }));
      }
  };

  const handleWhatsAppNotification = (type: 'invoice' | 'payment', transaction: Transaction, tenantId: string) => {
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) return;

      const token = Math.random().toString(36).substr(2);
      const link = `https://propmaster.app/portal/${type}/${transaction.id}?token=${token}`;
      
      let message = '';
      if (type === 'invoice') {
          message = language === 'ar' 
              ? `مرحبًا ${tenant.name}، تذكير بفاتورة مستحقة بقيمة ${transaction.amount}. عرض التفاصيل والدفع: ${link}`
              : `Dear ${tenant.name}, reminder for overdue invoice of ${transaction.amount} EGP. View details & pay: ${link}`;
      } else {
          message = language === 'ar'
              ? `مرحبًا ${tenant.name}، تم تسجيل دفعتك بقيمة ${transaction.amount}. عرض الإيصال: ${link}`
              : `Dear ${tenant.name}, your payment of ${transaction.amount} EGP has been recorded. View receipt: ${link}`;
      }

      const url = `https://wa.me/${tenant.phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  const submitTransaction = (type: 'invoice' | 'payment' | 'expense') => {
      if (onAddTransaction) {
          const newTx: Transaction = {
              id: `qa-${type}-${Date.now()}`,
              type: type,
              date: txForm.date || new Date().toISOString().split('T')[0],
              amount: Number(txForm.amount),
              description: txForm.description || (language === 'ar' ? `عملية سريعة` : `Quick ${type}`),
              status: type === 'payment' ? 'completed' : 'pending', // Default status
              relatedId: txForm.relatedId,
              paymentMethod: type === 'payment' ? 'cash' : undefined,
              category: type === 'expense' ? (txForm.category || 'General') : undefined
          };
          
          // For invoices, default to unpaid/pending
          if (type === 'invoice') newTx.status = 'unpaid';

          onAddTransaction(newTx);
          setActiveModal(null);
          
          // Trigger WhatsApp if applicable
          if ((type === 'invoice' || type === 'payment') && newTx.relatedId) {
              if (window.confirm(language === 'ar' ? 'هل أنت متأكد من إرسال إشعار عبر واتساب للمستأجر؟' : 'Do you want to send a WhatsApp notification to the tenant?')) {
                  handleWhatsAppNotification(type, newTx, newTx.relatedId);
              }
          } else {
              alert(language === 'ar' ? 'تم حفظ العملية بنجاح!' : `${type.charAt(0).toUpperCase() + type.slice(1)} recorded successfully!`);
          }
      }
  };

  const submitTenant = () => {
      if (onAddTenant && tenantForm.name && tenantForm.phone) {
          const newTenant: Tenant = {
              id: `qa-t-${Date.now()}`,
              name: tenantForm.name,
              phone: tenantForm.phone,
              email: tenantForm.email || '',
              nationalId: '', // Quick add might skip this
              status: 'active',
              apartmentId: tenantForm.apartmentId,
              balance: 0,
              leaseStart: tenantForm.leaseStart || new Date().toISOString().split('T')[0],
              leaseEnd: tenantForm.leaseEnd || ''
          };
          onAddTenant(newTenant);
          setActiveModal(null);
          alert(language === 'ar' ? 'تم تسجيل المستأجر بنجاح!' : 'Tenant registered successfully!');
      } else {
          alert(language === 'ar' ? 'يرجى إدخال الاسم ورقم الهاتف.' : 'Please fill in Name and Phone.');
      }
  };

  const handleReviewAction = (status: 'paid' | 'rejected') => {
      if (selectedReviewPayment && onEditTransaction) {
          const updatedTx = { ...selectedReviewPayment, status: status };
          onEditTransaction(updatedTx);
          setSelectedReviewPayment(null);
          alert(language === 'ar' 
            ? (status === 'paid' ? 'تم قبول الدفع بنجاح' : 'تم رفض الدفع') 
            : (status === 'paid' ? 'Payment Approved' : 'Payment Rejected'));
      }
  };

  const handleUpdateMaintenanceReq = () => {
      if (selectedMaintenance && onUpdateMaintenance) {
          onUpdateMaintenance(selectedMaintenance);
          alert(language === 'ar' ? 'تم تحديث طلب الصيانة' : 'Maintenance request updated');
          setSelectedMaintenance(null);
      }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'}</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalInvoices}</h3>
              <span className="text-xs text-red-500 flex items-center mt-1">
                {overdueInvoicesCount} {language === 'ar' ? 'متأخرة' : 'Overdue'}
              </span>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'المستلم (EGP)' : 'Received (EGP)'}</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalReceived.toLocaleString()}</h3>
              <span className="text-xs text-green-500 flex items-center mt-1">
                {language === 'ar' ? '+12% عن الشهر الماضي' : '+12% vs last month'}
              </span>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <DollarSignIcon />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'المستحق' : 'Outstanding'}</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalOutstanding.toLocaleString()}</h3>
              <span className="text-xs text-yellow-500 flex items-center mt-1">
                {language === 'ar' ? 'يحتاج انتباه' : 'Needs attention'}
              </span>
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
              <ArrowDownRight size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'صيانة قيد الانتظار' : 'Pending Maintenance'}</p>
                <div className="flex items-center justify-between mt-1">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{maintenance.filter(m => m.status === 'pending').length}</h3>
                    <div className="flex -space-x-2">
                         <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-700"></div>
                         <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-500 border-2 border-white dark:border-gray-700"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{language === 'ar' ? 'نظرة عامة على التدفق النقدي' : 'Cash Flow Overview'}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                    itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                />
                <Legend />
                <Bar dataKey="Income" name={language === 'ar' ? 'دخل' : 'Income'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" name={language === 'ar' ? 'مصروفات' : 'Expense'} fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{language === 'ar' ? 'تفاصيل المصروفات' : 'Expense Breakdown'}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <Bell className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} text-primary`} />
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            </h3>
            <div className={`space-y-4 max-h-60 overflow-y-auto ${language === 'ar' ? 'pl-2' : 'pr-2'}`}>
                {notifications.length > 0 ? (
                    notifications.map((notif, i) => (
                        <div key={i} className="flex items-start justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer border-b dark:border-gray-700 last:border-0">
                            <div className="flex items-start">
                                <div className={`w-2 h-2 rounded-full mt-2 ${language === 'ar' ? 'ml-3' : 'mr-3'} flex-shrink-0 ${notif.type === 'overdue' ? 'bg-red-500' : notif.type === 'pending_review' ? 'bg-blue-500' : notif.type === 'new_maintenance' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{notif.message}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                        <Clock size={10} /> {notif.time}
                                    </p>
                                </div>
                            </div>
                            {notif.type === 'pending_review' && (
                                <button 
                                    onClick={() => setSelectedReviewPayment(notif.data as Transaction)}
                                    className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {language === 'ar' ? 'مراجعة' : 'Review'}
                                </button>
                            )}
                             {notif.type === 'new_maintenance' && (
                                <button 
                                    onClick={() => setSelectedMaintenance(notif.data as MaintenanceRequest)}
                                    className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    {language === 'ar' ? 'عرض' : 'View'}
                                </button>
                            )}
                            {notif.type === 'overdue' && (
                                <button
                                    onClick={() => handleWhatsAppNotification('invoice', notif.data as Transaction, (notif.data as Transaction).relatedId || '')}
                                    className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 whitespace-nowrap"
                                >
                                    <Smartphone size={10} />
                                    {language === 'ar' ? 'تذكير' : 'Send Reminder'}
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 text-sm py-4">{language === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}</div>
                )}
            </div>
         </div>

         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
             <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
             <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handleQuickAction('invoice')} className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex flex-col items-center justify-center gap-2">
                     <FileText size={24} /> {language === 'ar' ? '+ فاتورة جديدة' : '+ New Invoice'}
                 </button>
                 <button onClick={() => handleQuickAction('payment')} className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 hover:text-green-600 dark:hover:text-green-400 transition-all flex flex-col items-center justify-center gap-2">
                     <DollarSign size={24} /> {language === 'ar' ? '+ تسجيل دفعة' : '+ Record Payment'}
                 </button>
                 <button onClick={() => handleQuickAction('expense')} className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all flex flex-col items-center justify-center gap-2">
                     <ArrowDown size={24} /> {language === 'ar' ? '+ إضافة مصروف' : '+ Add Expense'}
                 </button>
                 <button onClick={() => handleQuickAction('tenant')} className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all flex flex-col items-center justify-center gap-2">
                     <UserPlus size={24} /> {language === 'ar' ? '+ تسجيل مستأجر' : '+ Register Tenant'}
                 </button>
             </div>
         </div>
      </div>

      {/* Payment Review Modal */}
      {selectedReviewPayment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          <CheckCircle className="text-green-600" size={24} />
                          {language === 'ar' ? 'مراجعة الدفع' : 'Payment Review'}
                      </h3>
                      <button onClick={() => setSelectedReviewPayment(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">{language === 'ar' ? 'المبلغ المستلم' : 'Received Amount'}</p>
                          <p className="text-3xl font-bold text-gray-800 dark:text-white">{selectedReviewPayment.amount.toLocaleString()} EGP</p>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                              <span>{language === 'ar' ? 'المستأجر:' : 'Tenant:'}</span>
                              <span className="font-bold">{tenants.find(t => t.id === selectedReviewPayment.relatedId)?.name || selectedReviewPayment.relatedId}</span>
                          </div>
                          <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                              <span>{language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                              <span className="font-medium">{selectedReviewPayment.date}</span>
                          </div>
                          <div className="flex justify-between">
                              <span>{language === 'ar' ? 'الوصف:' : 'Description:'}</span>
                              <span className="font-medium">{selectedReviewPayment.description}</span>
                          </div>
                      </div>

                      {selectedReviewPayment.receiptUrl ? (
                          <div className="border rounded-lg p-2 dark:border-gray-700">
                              <p className="text-xs font-medium mb-2 text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الإيصال المرفق' : 'Attached Receipt'}</p>
                              {selectedReviewPayment.receiptUrl.endsWith('.pdf') ? (
                                  <div className="h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 rounded">
                                      PDF Document
                                  </div>
                              ) : (
                                  <img 
                                    src={selectedReviewPayment.receiptUrl} 
                                    alt="Receipt" 
                                    className="w-full h-40 object-cover rounded-lg hover:opacity-90 cursor-pointer"
                                    onClick={() => window.open(selectedReviewPayment.receiptUrl, '_blank')}
                                  />
                              )}
                              <a 
                                href={selectedReviewPayment.receiptUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-blue-600 flex items-center gap-1 mt-2 hover:underline justify-center"
                              >
                                  <ExternalLink size={12} /> {language === 'ar' ? 'عرض بالحجم الكامل' : 'View Full Size'}
                              </a>
                          </div>
                      ) : (
                          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400 italic">
                              {language === 'ar' ? 'لا يوجد إيصال مرفق' : 'No receipt attached'}
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
                      <button 
                        onClick={() => handleReviewAction('rejected')} 
                        className="flex-1 py-3 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                          {language === 'ar' ? 'رفض' : 'Reject'}
                      </button>
                      <button 
                        onClick={() => handleReviewAction('paid')} 
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm"
                      >
                          {language === 'ar' ? 'قبول الدفع' : 'Approve Payment'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Maintenance Request Details Modal */}
      {selectedMaintenance && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-orange-100 text-orange-600`}><Wrench size={24} /></div>
                          <div>
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}</h3>
                              <p className="text-xs text-gray-500">#{selectedMaintenance.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedMaintenance(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نوع المشكلة:' : 'Issue Type:'}</span>
                                <span className="font-semibold text-gray-800 dark:text-white">{selectedMaintenance.issueType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{language === 'ar' ? 'المستأجر:' : 'Tenant:'}</span>
                                <span className="font-semibold text-gray-800 dark:text-white">{tenants.find(t => t.id === selectedMaintenance.tenantId)?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الشقة:' : 'Apartment:'}</span>
                                <span className="font-semibold text-gray-800 dark:text-white">{selectedMaintenance.apartmentId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{language === 'ar' ? 'تاريخ التبليغ:' : 'Reported Date:'}</span>
                                <span className="font-semibold text-gray-800 dark:text-white">{selectedMaintenance.dateReported}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-700 p-3 rounded-lg">
                                {selectedMaintenance.description}
                            </p>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{language === 'ar' ? 'تعيين مورد' : 'Assign Vendor'}</label>
                             <select 
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                value={selectedMaintenance.assignedVendor || ''} 
                                onChange={(e) => setSelectedMaintenance({...selectedMaintenance, assignedVendor: e.target.value})}
                             >
                                 <option value="">{language === 'ar' ? '-- اختر مورد --' : '-- Select Vendor --'}</option>
                                 {MOCK_VENDORS.map(v => <option key={v.id} value={v.name}>{v.name} ({v.specialty})</option>)}
                             </select>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{language === 'ar' ? 'تحديث الحالة' : 'Update Status'}</label>
                             <select 
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                value={selectedMaintenance.status} 
                                onChange={(e) => setSelectedMaintenance({...selectedMaintenance, status: e.target.value as any})}
                             >
                                 <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                                 <option value="in-progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                                 <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                             </select>
                        </div>
                  </div>

                  <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                      <button onClick={() => setSelectedMaintenance(null)} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          {language === 'ar' ? 'إغلاق' : 'Close'}
                      </button>
                      <button onClick={handleUpdateMaintenanceReq} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                          <Save size={18} /> {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Quick Action Modals */}
      {activeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center gap-2">
                          {activeModal === 'invoice' && <FileText className="text-blue-500" />}
                          {activeModal === 'payment' && <DollarSign className="text-green-500" />}
                          {activeModal === 'expense' && <ArrowDown className="text-orange-500" />}
                          {activeModal === 'tenant' && <UserPlus className="text-purple-500" />}
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white capitalize">
                              {activeModal === 'invoice' ? (language === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create New Invoice') : 
                               activeModal === 'payment' ? (language === 'ar' ? 'تسجيل دفعة مستلمة' : 'Record Received Payment') : 
                               activeModal === 'expense' ? (language === 'ar' ? 'تسجيل مصروف' : 'Log Expense') : 
                               (language === 'ar' ? 'تسجيل مستأجر جديد' : 'Register New Tenant')}
                          </h3>
                      </div>
                      <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                          <X size={20} />
                      </button>
                  </div>
                  
                  {/* Modal Body */}
                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      
                      {/* --- Invoice Screen --- */}
                      {activeModal === 'invoice' && (
                          <>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المستأجر' : 'Tenant'}</label>
                                  <select 
                                      className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                      value={txForm.relatedId || ''}
                                      onChange={(e) => setTxForm({...txForm, relatedId: e.target.value})}
                                  >
                                      <option value="">{language === 'ar' ? 'اختر مستأجر' : 'Select Tenant'}</option>
                                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المبلغ (EGP)' : 'Amount (EGP)'}</label>
                                      <input 
                                          type="number" 
                                          className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                          value={txForm.amount || ''}
                                          onChange={(e) => setTxForm({...txForm, amount: parseFloat(e.target.value)})}
                                          placeholder="0.00"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                                      <input 
                                          type="date" 
                                          className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                          value={txForm.date || ''}
                                          onChange={(e) => setTxForm({...txForm, date: e.target.value})}
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الوصف / البنود' : 'Description / Items'}</label>
                                  <textarea 
                                      className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                      value={txForm.description || ''}
                                      onChange={(e) => setTxForm({...txForm, description: e.target.value})}
                                      placeholder={language === 'ar' ? "مثال: إيجار شهري، مرافق..." : "e.g. Monthly Rent, Utilities, Late Fees"}
                                      rows={3}
                                  />
                              </div>
                          </>
                      )}

                      {/* --- Payment Screen --- */}
                      {activeModal === 'payment' && (
                          <>
                              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                  <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">{language === 'ar' ? 'اختر فاتورة مستحقة' : 'Select Outstanding Invoice'}</label>
                                  <select 
                                      className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                      onChange={(e) => handleLinkInvoice(e.target.value)}
                                  >
                                      <option value="">{language === 'ar' ? '-- اختر فاتورة --' : '-- Choose Invoice --'}</option>
                                      {unpaidInvoicesList.map(inv => (
                                          <option key={inv.id} value={inv.id}>
                                              #{inv.id} - {inv.description} ({inv.amount} EGP)
                                          </option>
                                      ))}
                                  </select>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المبلغ (EGP)' : 'Payment Amount (EGP)'}</label>
                                      <input 
                                          type="number" 
                                          className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                          value={txForm.amount || ''}
                                          onChange={(e) => setTxForm({...txForm, amount: parseFloat(e.target.value)})}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ الاستلام' : 'Date Received'}</label>
                                      <input 
                                          type="date" 
                                          className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                          value={txForm.date || ''}
                                          onChange={(e) => setTxForm({...txForm, date: e.target.value})}
                                      />
                                  </div>
                              </div>
                              
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'ملاحظات / مرجع' : 'Notes / Reference'}</label>
                                  <input 
                                      type="text" 
                                      className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                      value={txForm.description || ''}
                                      onChange={(e) => setTxForm({...txForm, description: e.target.value})}
                                      placeholder={language === 'ar' ? "مثال: تحويل بنكي رقم..." : "e.g. Bank Transfer Ref #1234"}
                                  />
                              </div>
                          </>
                      )}

                      {/* --- Expense Screen --- */}
                      {activeModal === 'expense' && (
                          <>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                                  <select 
                                      className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                      value={txForm.category || ''}
                                      onChange={(e) => setTxForm({...txForm, category: e.target.value})}
                                  >
                                      <option value="">{language === 'ar' ? 'اختر تصنيف' : 'Select Category'}</option>
                                      <option value="Maintenance">{language === 'ar' ? 'صيانة وإصلاحات' : 'Maintenance & Repairs'}</option>
                                      <option value="Utilities">{language === 'ar' ? 'مرافق' : 'Utilities'}</option>
                                      <option value="Taxes">{language === 'ar' ? 'ضرائب وتأمين' : 'Taxes & Insurance'}</option>
                                      <option value="Management">{language === 'ar' ? 'رسوم إدارة' : 'Management Fees'}</option>
                                      <option value="Other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
                                  </select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المبلغ (EGP)' : 'Amount (EGP)'}</label>
                                      <input 
                                          type="number" 
                                          className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                          value={txForm.amount || ''}
                                          onChange={(e) => setTxForm({...txForm, amount: parseFloat(e.target.value)})}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Date Incurred'}</label>
                                      <input 
                                          type="date" 
                                          className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                          value={txForm.date || ''}
                                          onChange={(e) => setTxForm({...txForm, date: e.target.value})}
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                                  <textarea 
                                      className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                      value={txForm.description || ''}
                                      onChange={(e) => setTxForm({...txForm, description: e.target.value})}
                                      placeholder={language === 'ar' ? "مثال: إصلاح سباكة للشقة 101" : "e.g. Plumbing repair for Apt 101"}
                                      rows={2}
                                  />
                              </div>
                          </>
                      )}

                      {/* --- Tenant Registration Screen --- */}
                      {activeModal === 'tenant' && (
                          <>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
                                  <div className="relative">
                                      <User size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`}/>
                                      <input 
                                          type="text" 
                                          className={`w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                          value={tenantForm.name || ''}
                                          onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                                          placeholder="John Doe"
                                      />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الهاتف' : 'Phone'}</label>
                                      <input 
                                          type="tel" 
                                          className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                          value={tenantForm.phone || ''}
                                          onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                                          placeholder="01xxxxxxxxx"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                                      <input 
                                          type="email" 
                                          className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                          value={tenantForm.email || ''}
                                          onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                                          placeholder="email@example.com"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تعيين شقة' : 'Assign Apartment'}</label>
                                  <div className="relative">
                                      <Home size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`}/>
                                      <select 
                                          className={`w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                          value={tenantForm.apartmentId || ''}
                                          onChange={(e) => setTenantForm({...tenantForm, apartmentId: e.target.value})}
                                      >
                                          <option value="">{language === 'ar' ? 'اختر شقة' : 'Select Apartment'}</option>
                                          {apartments.map(a => <option key={a.id} value={a.id}>{a.number} - {a.building} ({a.status})</option>)}
                                      </select>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'بداية العقد' : 'Lease Start'}</label>
                                      <div className="relative">
                                          <Calendar size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`}/>
                                          <input 
                                              type="date" 
                                              className={`w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                              value={tenantForm.leaseStart || ''}
                                              onChange={(e) => setTenantForm({...tenantForm, leaseStart: e.target.value})}
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'نهاية العقد' : 'Lease End'}</label>
                                      <div className="relative">
                                          <Calendar size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`}/>
                                          <input 
                                              type="date" 
                                              className={`w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                              value={tenantForm.leaseEnd || ''}
                                              onChange={(e) => setTenantForm({...tenantForm, leaseEnd: e.target.value})}
                                          />
                                      </div>
                                  </div>
                              </div>
                          </>
                      )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                      <button onClick={() => setActiveModal(null)} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button 
                          onClick={() => activeModal === 'tenant' ? submitTenant() : submitTransaction(activeModal as any)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                          <Save size={18} /> 
                          {activeModal === 'invoice' ? (language === 'ar' ? 'إنشاء الفاتورة' : 'Generate Invoice') : 
                           activeModal === 'payment' ? (language === 'ar' ? 'حفظ الدفعة' : 'Record Payment') :
                           activeModal === 'expense' ? (language === 'ar' ? 'حفظ المصروف' : 'Record Expense') :
                           (language === 'ar' ? 'حفظ المستأجر' : 'Save Tenant')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const DollarSignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export default Dashboard;
