
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, Tenant } from '../types';
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight, CreditCard, Filter, Download, Plus, Edit, Trash2, X, Save, ArrowUpDown, ArrowUp, ArrowDown, Calendar, BellRing, CheckCircle, Smartphone, Mail, Archive, Link as LinkIcon, CheckSquare, Square, Send } from 'lucide-react';

interface FinanceProps {
  transactions: Transaction[];
  language: 'en' | 'ar';
  onAddTransaction: (t: Transaction) => void;
  onEditTransaction: (t: Transaction) => void;
  onArchiveTransaction: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  tenants: Tenant[];
}

const Finance: React.FC<FinanceProps> = ({ transactions, language, onAddTransaction, onEditTransaction, onArchiveTransaction, onDeleteTransaction, tenants }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'invoices' | 'payments' | 'expenses' | 'transfers'>('invoices');
  const [showModal, setShowModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>(null);

  // Reminder Automation State
  const [selectedReminders, setSelectedReminders] = useState<Set<string>>(new Set());
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  
  // Modal Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
      type: 'invoice',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: '',
      status: 'pending',
      relatedId: '',
      category: '',
      paymentMethod: 'cash'
  });

  const filteredTransactions = transactions.filter(t => {
      if (activeTab !== 'all' && !t.type.includes(activeTab.slice(0, -1))) {
         if (activeTab === 'invoices' && t.type !== 'invoice') return false;
         if (activeTab === 'payments' && t.type !== 'payment') return false;
         if (activeTab === 'expenses' && t.type !== 'expense') return false;
         if (activeTab === 'transfers' && t.type !== 'transfer') return false;
      }

      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      if (dateRange.start && t.date < dateRange.start) return false;
      if (dateRange.end && t.date > dateRange.end) return false;

      return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      
      let aValue = a[key];
      let bValue = b[key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
      }

      if (aValue! < bValue!) return direction === 'asc' ? -1 : 1;
      if (aValue! > bValue!) return direction === 'asc' ? 1 : -1;
      return 0;
  });

  const requestSort = (key: keyof Transaction) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Transaction) => {
      if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-50" />;
      return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'paid': case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          case 'unpaid': case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
          case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
          case 'archived': return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
          default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      }
  };

  const getStatusLabel = (status: string) => {
      if (language !== 'ar') return status;
      switch(status) {
          case 'paid': return 'مدفوع';
          case 'unpaid': return 'غير مدفوع';
          case 'pending': return 'قيد الانتظار';
          case 'overdue': return 'متأخر';
          case 'completed': return 'مكتمل';
          case 'archived': return 'مؤرشف';
          default: return status;
      }
  };

  const tabs = [
      { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
      { id: 'invoices', label: language === 'ar' ? 'الفواتير' : 'Invoices' },
      { id: 'payments', label: language === 'ar' ? 'المدفوعات' : 'Payments' },
      { id: 'expenses', label: language === 'ar' ? 'المصروفات' : 'Expenses' },
      { id: 'transfers', label: language === 'ar' ? 'التحويلات' : 'Transfers' },
  ];

  const handleOpenAddModal = () => {
      setFormData({
          type: activeTab === 'all' ? 'invoice' : activeTab === 'invoices' ? 'invoice' : activeTab === 'payments' ? 'payment' : activeTab === 'expenses' ? 'expense' : 'transfer',
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          description: '',
          status: 'pending',
          relatedId: '',
          category: '',
          paymentMethod: 'cash'
      });
      setIsEditing(false);
      setShowModal(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
      setFormData({ ...t });
      setIsEditing(true);
      setShowModal(true);
  };

  const handleDelete = (id: string) => {
      if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه المعاملة نهائياً؟' : 'Are you sure you want to permanently delete this transaction?')) {
          onDeleteTransaction(id);
      }
  };

  const handleArchive = (id: string) => {
      const msg = language === 'ar' ? 'أرشفة هذه المعاملة ستخفيها من الأرصدة النشطة. هل أنت متأكد؟' : 'Archiving this transaction will remove it from active balances. Continue?';
      if(window.confirm(msg)) {
          onArchiveTransaction(id);
      }
  };

  // List of unpaid or overdue invoices for reminders
  const overdueInvoices = useMemo(() => transactions.filter(t => t.type === 'invoice' && t.status === 'overdue'), [transactions]);
  
  // List for linking payment - Filtered by selected tenant if any
  const availableInvoices = useMemo(() => {
      return transactions.filter(t => {
          const isInvoice = t.type === 'invoice';
          const isUnpaid = t.status === 'unpaid' || t.status === 'overdue';
          const matchesTenant = formData.relatedId ? t.relatedId === formData.relatedId : true;
          return isInvoice && isUnpaid && matchesTenant;
      });
  }, [transactions, formData.relatedId]);

  const handleLinkInvoice = (invoiceId: string) => {
      if (!invoiceId) return;
      const invoice = transactions.find(t => t.id === invoiceId);
      if (invoice) {
          setFormData(prev => ({
              ...prev,
              amount: invoice.amount,
              description: language === 'ar' ? `دفعة للفاتورة ${invoice.description}` : `Payment for ${invoice.description}`,
              relatedId: invoice.relatedId, 
          }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const transaction: Transaction = {
          id: isEditing ? formData.id! : `tx-${Date.now()}`,
          type: formData.type as TransactionType,
          date: formData.date || new Date().toISOString().split('T')[0],
          amount: Number(formData.amount),
          description: formData.description || '',
          status: formData.status as TransactionStatus,
          relatedId: formData.relatedId,
          category: formData.category,
          paymentMethod: formData.paymentMethod as any
      };

      if (isEditing) {
          onEditTransaction(transaction);
      } else {
          onAddTransaction(transaction);
      }
      setShowModal(false);
  };

  // Helper to generate a simulated link to the tenant portal invoice
  const generateInvoiceLink = (invoiceId: string) => {
    return `https://propmaster.app/portal/invoices/${invoiceId}`;
  };
  
  const getMessageContent = (invoice: Transaction, tenant: Tenant, lang: 'en' | 'ar') => {
    const link = generateInvoiceLink(invoice.id);
    return lang === 'ar' 
        ? `مرحبًا ${tenant.name}، فاتورة الإيجار للشقة #${tenant.apartmentId} بقيمة ${invoice.amount} EGP مستحقة منذ ${invoice.date}. يرجى السداد عبر الرابط: ${link}`
        : `Dear ${tenant.name}, your rent invoice for Apt #${tenant.apartmentId} (${invoice.amount} EGP) was due on ${invoice.date}. Please pay via: ${link}`;
  };

  const handleSendReminder = (invoice: Transaction) => {
      const tenant = tenants.find(t => t.id === invoice.relatedId);
      if (!tenant) return;
      
      const message = getMessageContent(invoice, tenant, language);
      const url = `https://wa.me/${tenant.phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  const handlePayNow = (invoice: Transaction) => {
      setFormData({
          type: 'payment',
          date: new Date().toISOString().split('T')[0],
          amount: invoice.amount,
          description: language === 'ar' ? `دفعة للفاتورة ${invoice.description}` : `Payment for ${invoice.description}`,
          status: 'completed',
          relatedId: invoice.relatedId,
          paymentMethod: 'card'
      });
      setIsEditing(false);
      setShowModal(true);
  };

  const handleExport = () => {
    const headers = ['ID', 'Date', 'Type', 'Description', 'Amount', 'Status', 'Related ID'];
    const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(t => [t.id, t.date, t.type, t.description, t.amount, t.status, t.relatedId || ''].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'financial_transactions.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  // Reminder Modal Handlers
  const toggleReminderSelection = (id: string) => {
      const newSet = new Set(selectedReminders);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedReminders(newSet);
  };

  const toggleSelectAllReminders = () => {
      if (selectedReminders.size === overdueInvoices.length) {
          setSelectedReminders(new Set());
      } else {
          setSelectedReminders(new Set(overdueInvoices.map(i => i.id)));
      }
  };

  const handleBatchSend = () => {
      if (reminderChannel === 'whatsapp') {
          // Can't batch open windows easily, handled by inline buttons
          return; 
      }
      // Mock sending emails
      alert(language === 'ar' 
        ? `تم إرسال ${selectedReminders.size} رسالة تذكير عبر البريد الإلكتروني بنجاح.` 
        : `Successfully sent ${selectedReminders.size} email reminders.`);
      setShowReminderModal(false);
      setSelectedReminders(new Set());
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {language === 'ar' ? 'المعاملات المالية' : 'Financial Transactions'}
            </h2>
            <div className="flex gap-2 flex-wrap">
                 <button 
                    onClick={() => {
                        setSelectedReminders(new Set());
                        setShowReminderModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors border border-yellow-200 dark:border-yellow-800"
                 >
                     <BellRing size={16} />
                     <span>{language === 'ar' ? 'تذكيرات الدفع' : 'Payment Reminders'}</span>
                 </button>
                 <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                     <Download size={16} />
                     <span>{language === 'ar' ? 'تصدير' : 'Export'}</span>
                 </button>
                 <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm"
                 >
                     <Plus size={16} />
                     <span>{language === 'ar' ? 'معاملة جديدة' : 'New Transaction'}</span>
                 </button>
            </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 transition-colors items-end">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                    <div className="relative">
                        <Calendar size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                        <input type="date" className={`w-full py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                            value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</label>
                    <div className="relative">
                        <Calendar size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                        <input type="date" className={`w-full py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                            value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                    <div className="relative">
                        <Filter size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                        <select className={`w-full py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                            <option value="paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
                            <option value="unpaid">{language === 'ar' ? 'غير مدفوع' : 'Unpaid'}</option>
                            <option value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</option>
                            <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                            <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                            <option value="archived">{language === 'ar' ? 'مؤرشف' : 'Archived'}</option>
                        </select>
                    </div>
                </div>
            </div>
            <button onClick={() => { setDateRange({start: '', end: ''}); setStatusFilter('all'); }} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
            </button>
        </div>

        {/* ... Tabs ... */}
        <div className="flex border-b dark:border-gray-700 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                        activeTab === tab.id ? 'border-primary text-primary dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Content Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                        <tr>
                            <th className={`p-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => requestSort('id')}>
                                <div className="flex items-center gap-1">{activeTab === 'invoices' ? (language === 'ar' ? 'رقم الفاتورة' : 'Invoice #') : (language === 'ar' ? 'المعرف' : 'ID')} {getSortIcon('id')}</div>
                            </th>
                            <th className={`p-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => requestSort('date')}>
                                <div className="flex items-center gap-1">{language === 'ar' ? 'التاريخ' : 'Date'} {getSortIcon('date')}</div>
                            </th>
                            <th className={`p-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => requestSort('type')}>
                                <div className="flex items-center gap-1">{language === 'ar' ? 'النوع' : 'Type'} {getSortIcon('type')}</div>
                            </th>
                            <th className={`p-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => requestSort('description')}>
                                <div className="flex items-center gap-1">{language === 'ar' ? 'الوصف' : 'Description'} {getSortIcon('description')}</div>
                            </th>
                            <th className={`p-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => requestSort('amount')}>
                                <div className="flex items-center gap-1">{language === 'ar' ? 'المبلغ' : 'Amount'} {getSortIcon('amount')}</div>
                            </th>
                            <th className={`p-4 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => requestSort('status')}>
                                <div className="flex items-center gap-1">{language === 'ar' ? 'الحالة' : 'Status'} {getSortIcon('status')}</div>
                            </th>
                            <th className={`p-4 font-semibold text-gray-600 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                {language === 'ar' ? 'الإجراء' : 'Action'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {sortedTransactions.map(t => (
                            <tr key={t.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${t.status === 'archived' ? 'opacity-50' : ''}`}>
                                <td className={`p-4 text-sm font-mono text-gray-500 dark:text-gray-400 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {t.type === 'invoice' ? t.id : `#${t.id}`}
                                </td>
                                <td className={`p-4 text-sm text-gray-800 dark:text-gray-200 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t.date}</td>
                                <td className={`p-4 text-sm text-gray-800 dark:text-gray-200 capitalize ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                    <div className="flex items-center gap-2">
                                        {t.type === 'invoice' && <FileText size={16} className="text-gray-400" />}
                                        {t.type === 'payment' && <DollarSign size={16} className="text-green-500" />}
                                        {t.type === 'expense' && <ArrowDownRight size={16} className="text-red-500" />}
                                        {t.type === 'transfer' && <ArrowUpRight size={16} className="text-blue-500" />}
                                        {language === 'ar' 
                                          ? (t.type === 'invoice' ? 'فاتورة' : t.type === 'payment' ? 'دفعة' : t.type === 'expense' ? 'مصروف' : 'تحويل')
                                          : (t.type === 'expense' && t.category ? `${t.type} (${t.category})` : t.type)}
                                    </div>
                                </td>
                                <td className={`p-4 text-sm text-gray-800 dark:text-gray-200 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {t.description}
                                    {t.relatedId && <div className="text-xs text-gray-400 mt-0.5">Ref: {t.relatedId}</div>}
                                </td>
                                <td className={`p-4 font-bold text-gray-800 dark:text-white ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {t.amount.toLocaleString()} EGP
                                </td>
                                <td className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(t.status)}`}>
                                        {getStatusLabel(t.status)}
                                    </span>
                                </td>
                                <td className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                    <div className="flex items-center gap-2">
                                        {(t.status === 'unpaid' || t.status === 'overdue') && t.type === 'invoice' && (
                                            <>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePayNow(t);
                                                    }}
                                                    className="bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 px-3 py-1 rounded text-xs font-bold transition-colors"
                                                >
                                                    {language === 'ar' ? 'ادفع الآن' : 'Pay Now'}
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSendReminder(t);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    title={language === 'ar' ? 'إرسال تذكير' : 'Send Reminder'}
                                                >
                                                    <Smartphone size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenEditModal(t);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            title={language === 'ar' ? 'تعديل' : 'Edit'}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {t.status !== 'archived' && (
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleArchive(t.id);
                                                }}
                                                className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                title={language === 'ar' ? 'أرشفة' : 'Archive'}
                                            >
                                                <Archive size={16} />
                                            </button>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(t.id);
                                            }}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title={language === 'ar' ? 'حذف' : 'Delete'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTransactions.length === 0 && (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? 'لا توجد معاملات مطابقة للفلاتر.' : 'No transactions found matching your filters.'}
                    </div>
                )}
            </div>
        </div>

        {/* Reminder Modal (New Implementation) */}
        {showReminderModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {language === 'ar' ? 'معالجة الفواتير المتأخرة' : 'Process Overdue Invoices'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {language === 'ar' ? 'إرسال إشعارات للمستأجرين' : 'Send notifications to tenants'}
                            </p>
                        </div>
                        <button onClick={() => setShowReminderModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b dark:border-gray-700 flex items-center justify-between">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="channel" 
                                    checked={reminderChannel === 'whatsapp'} 
                                    onChange={() => setReminderChannel('whatsapp')}
                                    className="text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    <Smartphone size={16} /> WhatsApp
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="channel" 
                                    checked={reminderChannel === 'email'} 
                                    onChange={() => setReminderChannel('email')}
                                    className="text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    <Mail size={16} /> Email / System
                                </span>
                            </label>
                        </div>
                        {reminderChannel === 'email' && (
                            <button onClick={toggleSelectAllReminders} className="text-sm text-primary hover:underline">
                                {selectedReminders.size === overdueInvoices.length ? (language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All') : (language === 'ar' ? 'تحديد الكل' : 'Select All')}
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        {overdueInvoices.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                                    <tr>
                                        <th className="p-4 w-10">
                                            {reminderChannel === 'email' && (
                                                <button onClick={toggleSelectAllReminders}>
                                                    {selectedReminders.size === overdueInvoices.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            )}
                                        </th>
                                        <th className="p-4">{language === 'ar' ? 'المستأجر' : 'Tenant'}</th>
                                        <th className="p-4">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                        <th className="p-4">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                        <th className="p-4 text-center">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {overdueInvoices.map(invoice => {
                                        const tenant = tenants.find(t => t.id === invoice.relatedId);
                                        return (
                                            <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="p-4">
                                                    {reminderChannel === 'email' && (
                                                        <button onClick={() => toggleReminderSelection(invoice.id)}>
                                                            {selectedReminders.has(invoice.id) ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-gray-400" />}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="p-4 font-medium text-gray-800 dark:text-white">
                                                    {tenant?.name || invoice.relatedId}
                                                    <div className="text-xs text-gray-500">Apt {tenant?.apartmentId}</div>
                                                </td>
                                                <td className="p-4 text-red-500 font-medium">{invoice.date}</td>
                                                <td className="p-4 text-gray-800 dark:text-gray-200">{invoice.amount.toLocaleString()} EGP</td>
                                                <td className="p-4 text-center">
                                                    {reminderChannel === 'whatsapp' ? (
                                                        <button 
                                                            onClick={() => handleSendReminder(invoice)}
                                                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 mx-auto"
                                                        >
                                                            <Send size={12} /> {language === 'ar' ? 'إرسال' : 'Send'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">{selectedReminders.has(invoice.id) ? (language === 'ar' ? 'محدد' : 'Selected') : '-'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                {language === 'ar' ? 'لا توجد فواتير متأخرة حالياً.' : 'No overdue invoices at the moment.'}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                        <button onClick={() => setShowReminderModal(false)} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            {language === 'ar' ? 'إغلاق' : 'Close'}
                        </button>
                        {reminderChannel === 'email' && (
                            <button 
                                onClick={handleBatchSend}
                                disabled={selectedReminders.size === 0}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Mail size={16} />
                                {language === 'ar' ? `إرسال (${selectedReminders.size})` : `Send Batch (${selectedReminders.size})`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Transaction Edit/Add Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                    <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {isEditing 
                                ? (language === 'ar' ? 'تعديل المعاملة' : 'Edit Transaction') 
                                : (language === 'ar' ? 'معاملة جديدة' : 'New Transaction')}
                        </h3>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'نوع المعاملة' : 'Transaction Type'}</label>
                            <select 
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
                                disabled={isEditing}
                            >
                                <option value="invoice">{language === 'ar' ? 'فاتورة' : 'Invoice'}</option>
                                <option value="payment">{language === 'ar' ? 'دفعة مستلمة' : 'Payment Received'}</option>
                                <option value="expense">{language === 'ar' ? 'مصروف' : 'Expense'}</option>
                                <option value="transfer">{language === 'ar' ? 'تحويل' : 'Transfer'}</option>
                            </select>
                        </div>
                        
                        {/* Link Payment to Invoice Dropdown (Improved Logic) */}
                        {formData.type === 'payment' && !isEditing && (
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                  <label className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                                      <LinkIcon size={12} />
                                      {language === 'ar' ? 'ربط بفاتورة غير مدفوعة (اختياري)' : 'Link to Unpaid Invoice (Optional)'}
                                  </label>
                                  <select 
                                      className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                      onChange={(e) => handleLinkInvoice(e.target.value)}
                                  >
                                      <option value="">{language === 'ar' ? '-- اختر فاتورة --' : '-- Select Invoice --'}</option>
                                      {availableInvoices.map(inv => (
                                          <option key={inv.id} value={inv.id}>
                                              #{inv.id} - {inv.description} ({inv.amount} EGP) - Due: {inv.date}
                                          </option>
                                      ))}
                                  </select>
                              </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المبلغ (EGP)' : 'Amount (EGP)'}</label>
                                <input 
                                    type="number" 
                                    required
                                    className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'التاريخ' : 'Date'}</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                        </div>

                        {(formData.type === 'invoice' || formData.type === 'payment') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المستأجر' : 'Tenant'}</label>
                                <select 
                                    className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.relatedId}
                                    onChange={(e) => setFormData({...formData, relatedId: e.target.value})}
                                >
                                    <option value="">{language === 'ar' ? '-- اختر مستأجر --' : '-- Select Tenant --'}</option>
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} (Apt {t.apartmentId})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {formData.type === 'expense' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                                <select 
                                    className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="">{language === 'ar' ? '-- اختر تصنيف --' : '-- Select Category --'}</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Taxes">Taxes</option>
                                    <option value="Management">Management</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                            <input 
                                type="text" 
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder={language === 'ar' ? 'وصف المعاملة' : 'Transaction description'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                            <select 
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as TransactionStatus})}
                            >
                                <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                                <option value="paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
                                <option value="unpaid">{language === 'ar' ? 'غير مدفوع' : 'Unpaid'}</option>
                                <option value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</option>
                                <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                                <option value="archived">{language === 'ar' ? 'مؤرشف' : 'Archived'}</option>
                            </select>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <Save size={18} /> {isEditing ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'حفظ' : 'Save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Finance;
