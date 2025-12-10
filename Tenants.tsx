
import React, { useState, useMemo } from 'react';
import { Tenant, Transaction, MaintenanceRequest } from '../types';
import { Search, Plus, User, Phone, Mail, Home, ArrowUpDown, Filter, X, Save, History, MoreVertical, Edit, Trash2, Zap, Tag, BadgeCheck, MessageSquare, Send, Wrench, Archive } from 'lucide-react';

interface TenantsProps {
  tenants: Tenant[];
  transactions: Transaction[];
  maintenance: MaintenanceRequest[];
  onAddTenant: (t: Tenant) => void;
  onUpdateTenant: (t: Tenant) => void;
  onArchiveTenant: (id: string) => void;
  onDeleteTenant: (id: string) => void;
  language: 'en' | 'ar';
}

const Tenants: React.FC<TenantsProps> = ({ tenants, transactions, maintenance, onAddTenant, onUpdateTenant, onArchiveTenant, onDeleteTenant, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedHistoryTenant, setSelectedHistoryTenant] = useState<Tenant | null>(null);
  const [selectedProfileTenant, setSelectedProfileTenant] = useState<Tenant | null>(null);
  const [selectedMsgTenant, setSelectedMsgTenant] = useState<Tenant | null>(null);
  
  // Action Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // New/Edit Tenant Form State
  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    status: 'active',
    apartmentId: '',
    balance: 0,
    leaseStart: '',
    leaseEnd: ''
  });
  
  // Message Form State
  const [messageData, setMessageData] = useState({
      channel: 'whatsapp',
      template: '',
      content: ''
  });

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.apartmentId && t.apartmentId.includes(searchTerm)) ||
                          t.phone.includes(searchTerm) ||
                          t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    // By default hide archived if filter is 'all', unless explicitly searched or filtered? 
    // Let's keep 'all' showing everything or just active/inactive? Standard is usually to hide archived.
    // For simplicity, 'all' shows all.
    return matchesSearch && matchesStatus;
  });

  const sortedTenants = [...filteredTenants].sort((a, b) => {
    return sortOrder === 'asc' 
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name);
  });

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleOpenHistory = (tenant: Tenant) => {
    setSelectedHistoryTenant(tenant);
    setShowHistoryModal(true);
    setOpenMenuId(null);
  };

  const handleOpenProfile = (tenant: Tenant) => {
    setSelectedProfileTenant(tenant);
    setShowProfileModal(true);
    setOpenMenuId(null);
  };
  
  const handleOpenMessage = (tenant: Tenant) => {
    setSelectedMsgTenant(tenant);
    setMessageData({ channel: 'whatsapp', template: '', content: '' });
    setShowMsgModal(true);
    setOpenMenuId(null);
  };

  const handleOpenAdd = () => {
    setFormData({
        name: '', phone: '', email: '', nationalId: '', status: 'active', apartmentId: '', balance: 0, leaseStart: '', leaseEnd: ''
    });
    setIsEditing(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (tenant: Tenant) => {
      setFormData({ ...tenant });
      setIsEditing(true);
      setShowAddModal(true);
      setOpenMenuId(null);
  };

  const handleArchive = (id: string) => {
      const confirmMsg = language === 'ar'
        ? 'هل أنت متأكد من أرشفة هذا المستأجر؟ سيتم الاحتفاظ بالبيانات كمرجع تاريخي.'
        : 'Are you sure you want to archive this tenant? Data will be kept for historical reference.';
      if(window.confirm(confirmMsg)) {
          onArchiveTenant(id);
          setOpenMenuId(null);
      }
  };

  const handleDelete = (id: string) => {
      const warning = language === 'ar' 
        ? 'تحذير: حذف المستأجر سيؤدي إلى حذف جميع العقود والمعاملات المالية وسجلات الصيانة المرتبطة به نهائياً. هل أنت متأكد؟'
        : 'WARNING: Deleting this tenant will PERMANENTLY remove all linked contracts, financial records, and maintenance requests. Are you sure?';
      
      if(window.confirm(warning)) {
          onDeleteTenant(id);
          setOpenMenuId(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      const tenantData: Tenant = {
        id: isEditing ? formData.id! : `t${Date.now()}`,
        name: formData.name!,
        phone: formData.phone!,
        email: formData.email || '',
        nationalId: formData.nationalId || '',
        status: formData.status as any,
        apartmentId: formData.apartmentId,
        balance: Number(formData.balance) || 0,
        leaseStart: formData.leaseStart || new Date().toISOString().split('T')[0],
        leaseEnd: formData.leaseEnd || new Date().toISOString().split('T')[0],
      };
      
      if (isEditing) {
          onUpdateTenant(tenantData);
      } else {
          onAddTenant(tenantData);
      }
      
      setShowAddModal(false);
    }
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if(selectedMsgTenant && messageData.content) {
          alert(language === 'ar' 
            ? `تم إرسال الرسالة إلى ${selectedMsgTenant.name} عبر ${messageData.channel}` 
            : `Message sent to ${selectedMsgTenant.name} via ${messageData.channel}`);
          setShowMsgModal(false);
      }
  };
  
  const applyTemplate = (val: string) => {
      let text = '';
      if (language === 'ar') {
          if(val === 'rent') text = `عزيزي ${selectedMsgTenant?.name}، هذا تذكير بأن الإيجار يستحق قريباً. يرجى الدفع لتجنب الغرامات.`;
          if(val === 'maintenance') text = `عزيزي ${selectedMsgTenant?.name}، هناك أعمال صيانة مجدولة في شقتك الأسبوع القادم.`;
          if(val === 'general') text = `مرحباً ${selectedMsgTenant?.name}، يرجى التواصل مع إدارة العقار بخصوص تحديث هام.`;
      } else {
          if(val === 'rent') text = `Dear ${selectedMsgTenant?.name}, this is a reminder that rent is due soon. Please ensure payment to avoid late fees.`;
          if(val === 'maintenance') text = `Dear ${selectedMsgTenant?.name}, maintenance work is scheduled for your apartment next week.`;
          if(val === 'general') text = `Hello ${selectedMsgTenant?.name}, please contact the management office regarding a quick update.`;
      }
      
      setMessageData({ ...messageData, template: val, content: text });
  };

  const tenantTransactions = selectedHistoryTenant 
    ? transactions.filter(t => t.relatedId === selectedHistoryTenant.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  
  const tenantMaintenance = selectedHistoryTenant
    ? maintenance.filter(m => m.tenantId === selectedHistoryTenant.id).sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime())
    : [];

  const historySummary = useMemo(() => {
    if (!selectedHistoryTenant) return { invoiced: 0, paid: 0, outstanding: 0, categories: { rent: 0, utilities: 0, fees: 0 } };
    
    const invoiced = tenantTransactions.filter(t => t.type === 'invoice').reduce((acc, t) => acc + t.amount, 0);
    const paid = tenantTransactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0);
    const outstanding = tenantTransactions.filter(t => t.type === 'invoice' && (t.status === 'unpaid' || t.status === 'overdue')).reduce((acc, t) => acc + t.amount, 0);
    
    const categories = tenantTransactions
        .filter(t => t.type === 'invoice')
        .reduce((acc, t) => {
            const text = (t.description + ' ' + (t.category || '')).toLowerCase();
            if (text.includes('rent') || text.includes('إيجار')) {
                acc.rent += t.amount;
            } else if (text.includes('utilit') || text.includes('water') || text.includes('electr') || text.includes('gas') || text.includes('internet') || text.includes('مرافق')) {
                acc.utilities += t.amount;
            } else if (text.includes('fee') || text.includes('tax') || text.includes('penalty') || text.includes('fine') || text.includes('deposit') || text.includes('غرامة') || text.includes('رسوم')) {
                acc.fees += t.amount;
            }
            return acc;
        }, { rent: 0, utilities: 0, fees: 0 });

    return { invoiced, paid, outstanding, categories };
  }, [tenantTransactions, selectedHistoryTenant]);

  return (
    <div className="p-6 space-y-6 animate-fade-in" onClick={() => setOpenMenuId(null)}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {language === 'ar' ? 'إدارة المستأجرين' : 'Tenants Management'}
        </h2>
        <button 
          onClick={(e) => { e.stopPropagation(); handleOpenAdd(); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
            <Plus size={18} />
            <span>{language === 'ar' ? 'إضافة مستأجر' : 'Add Tenant'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 transition-colors">
         <div className="relative flex-1">
             <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
             <input 
                type="text" 
                placeholder={language === 'ar' ? 'بحث بالاسم، الهاتف، الشقة...' : 'Search by name, phone, apartment...'}
                className={`w-full py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
         </div>
         
         <div className="flex gap-2">
            <div className="relative">
                <select 
                    className={`appearance-none border dark:border-gray-600 rounded-lg py-2 text-gray-600 dark:text-gray-300 bg-transparent focus:outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${language === 'ar' ? 'pl-4 pr-10' : 'pl-4 pr-10'}`}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                    <option value="all">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                    <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                    <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
                    <option value="archived">{language === 'ar' ? 'مؤرشف' : 'Archived'}</option>
                </select>
                <Filter size={16} className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none ${language === 'ar' ? 'left-3' : 'right-3'}`} />
            </div>

            <button 
                onClick={toggleSort}
                className="flex items-center gap-2 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[120px] justify-center"
                title={language === 'ar' ? 'ترتيب أبجدي' : 'Sort Alphabetically'}
            >
                <ArrowUpDown size={16} />
                <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTenants.map((tenant) => (
            <div key={tenant.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible hover:shadow-md transition-all group relative ${tenant.status === 'archived' ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-10`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === tenant.id ? null : tenant.id); }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                    {openMenuId === tenant.id && (
                        <div 
                            className={`absolute top-8 ${language === 'ar' ? 'left-0' : 'right-0'} bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 w-32 border dark:border-gray-600 animate-in fade-in zoom-in-95 duration-100 z-20`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => handleOpenEdit(tenant)} 
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                            >
                                <Edit size={14}/> {language === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            {tenant.status !== 'archived' && (
                                <button 
                                    onClick={() => handleArchive(tenant.id)} 
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-orange-600"
                                >
                                    <Archive size={14}/> {language === 'ar' ? 'أرشفة' : 'Archive'}
                                </button>
                            )}
                            <button 
                                onClick={() => handleDelete(tenant.id)} 
                                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 text-sm"
                            >
                                <Trash2 size={14}/> {language === 'ar' ? 'حذف' : 'Delete'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-primary transition-colors">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-white">{tenant.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                                    tenant.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                    tenant.status === 'archived' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}>
                                    {language === 'ar' ? (tenant.status === 'active' ? 'نشط' : tenant.status === 'archived' ? 'مؤرشف' : 'غير نشط') : tenant.status}
                                </span>
                            </div>
                        </div>
                        {tenant.balance > 0 && (
                            <div className={`text-right ${language === 'ar' ? 'mr-auto ml-8' : 'ml-auto mr-8'}`}>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الرصيد' : 'Balance'}</p>
                                <p className="text-sm font-bold text-red-500">{tenant.balance.toLocaleString()} EGP</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Home size={16} className="text-gray-400" />
                            <span>{language === 'ar' ? 'الشقة:' : 'Apt:'} <span className="font-medium text-gray-800 dark:text-gray-200">{tenant.apartmentId || (language === 'ar' ? 'غير محدد' : 'N/A')}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-400" />
                            <span>{tenant.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" />
                            <span className="truncate max-w-[180px]">{tenant.email}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t dark:border-gray-700 flex justify-between">
                    <button 
                        onClick={() => handleOpenProfile(tenant)}
                        className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                    >
                        <User size={14} /> {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleOpenMessage(tenant)}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1 transition-colors"
                            title={language === 'ar' ? 'إرسال رسالة' : 'Send Message'}
                        >
                            <MessageSquare size={14} /> {language === 'ar' ? 'رسالة' : 'Message'}
                        </button>
                        <button 
                            onClick={() => handleOpenHistory(tenant)}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                        >
                            <History size={14} /> {language === 'ar' ? 'السجل' : 'History'}
                        </button>
                    </div>
                </div>
            </div>
        ))}
        {sortedTenants.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <p>{language === 'ar' ? 'لا يوجد مستأجرين مطابقين للبحث' : 'No tenants found matching your criteria.'}</p>
            </div>
        )}
      </div>

      {/* Modals omitted for brevity, they remain similar but use new handlers */}
      {/* ... Add/Edit/Msg/Profile/History Modals ... */}
      {showAddModal && (
         <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Same modal content as before */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-gray-50 dark:bg-gray-700/50 p-6 border-b dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {isEditing 
                        ? (language === 'ar' ? 'تعديل بيانات المستأجر' : 'Edit Tenant Details') 
                        : (language === 'ar' ? 'إضافة مستأجر جديد' : 'Add New Tenant')}
                  </h3>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                     <X size={20} />
                  </button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                  {/* ... same form fields ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-full">
                          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</h4>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الاسم بالكامل' : 'Full Name'} <span className="text-red-500">*</span></label>
                          <input required type="text" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'رقم الهوية / جواز السفر' : 'National ID / Passport'}</label>
                          <input type="text" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} <span className="text-red-500">*</span></label>
                          <input required type="tel" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                          <input type="email" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>

                      <div className="col-span-full mt-2">
                          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{language === 'ar' ? 'بيانات العقد والشقة' : 'Lease & Apartment'}</h4>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'رقم الشقة' : 'Apartment ID'}</label>
                          <input type="text" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})} placeholder={language === 'ar' ? "مثال: 101" : "e.g. 101"} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الرصيد الافتتاحي (EGP)' : 'Initial Balance (EGP)'}</label>
                          <input type="number" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            value={formData.balance} onChange={e => setFormData({...formData, balance: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ بدء العقد' : 'Lease Start Date'}</label>
                          <input type="date" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            value={formData.leaseStart} onChange={e => setFormData({...formData, leaseStart: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ انتهاء العقد' : 'Lease End Date'}</label>
                          <input type="date" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            value={formData.leaseEnd} onChange={e => setFormData({...formData, leaseEnd: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                          <select className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                                <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
                                <option value="archived">{language === 'ar' ? 'مؤرشف' : 'Archived'}</option>
                          </select>
                      </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                      <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                          <Save size={18} /> {isEditing ? (language === 'ar' ? 'تحديث' : 'Update Tenant') : (language === 'ar' ? 'حفظ' : 'Save Tenant')}
                      </button>
                  </div>
               </form>
            </div>
         </div>
      )}
      {/* ... Rest of modals (Message, History, Profile) remain ... */}
      {showMsgModal && selectedMsgTenant && (
          <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             {/* ... Msg Modal Content ... */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <MessageSquare size={24} />
                        <div>
                            <h3 className="text-xl font-bold">{language === 'ar' ? 'رسالة سريعة' : 'Quick Message'}</h3>
                            <p className="text-sm opacity-90">{language === 'ar' ? 'إلى:' : 'To:'} {selectedMsgTenant.name}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowMsgModal(false)} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20">
                         <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                     {/* ... fields ... */}
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'القناة' : 'Channel'}</label>
                         <div className="flex gap-4">
                             <label className="flex items-center gap-2 cursor-pointer border dark:border-gray-600 p-3 rounded-lg flex-1 hover:bg-gray-50 dark:hover:bg-gray-700">
                                 <input type="radio" name="channel" value="whatsapp" checked={messageData.channel === 'whatsapp'} onChange={(e) => setMessageData({...messageData, channel: e.target.value})} className="text-primary focus:ring-primary" />
                                 <span className="text-sm text-gray-700 dark:text-gray-200">WhatsApp</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer border dark:border-gray-600 p-3 rounded-lg flex-1 hover:bg-gray-50 dark:hover:bg-gray-700">
                                 <input type="radio" name="channel" value="sms" checked={messageData.channel === 'sms'} onChange={(e) => setMessageData({...messageData, channel: e.target.value})} className="text-primary focus:ring-primary" />
                                 <span className="text-sm text-gray-700 dark:text-gray-200">SMS</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer border dark:border-gray-600 p-3 rounded-lg flex-1 hover:bg-gray-50 dark:hover:bg-gray-700">
                                 <input type="radio" name="channel" value="email" checked={messageData.channel === 'email'} onChange={(e) => setMessageData({...messageData, channel: e.target.value})} className="text-primary focus:ring-primary" />
                                 <span className="text-sm text-gray-700 dark:text-gray-200">Email</span>
                             </label>
                         </div>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'القالب' : 'Template'}</label>
                         <select 
                            className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            value={messageData.template}
                            onChange={(e) => applyTemplate(e.target.value)}
                         >
                             <option value="">{language === 'ar' ? 'اختر قالب...' : 'Select a template...'}</option>
                             <option value="rent">{language === 'ar' ? 'تذكير بالإيجار' : 'Rent Reminder'}</option>
                             <option value="maintenance">{language === 'ar' ? 'إشعار صيانة' : 'Maintenance Notification'}</option>
                             <option value="general">{language === 'ar' ? 'استفسار عام' : 'General Inquiry'}</option>
                         </select>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'نص الرسالة' : 'Message Content'}</label>
                         <textarea 
                             required
                             rows={4}
                             className="w-full border dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                             value={messageData.content}
                             onChange={(e) => setMessageData({...messageData, content: e.target.value})}
                             placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                         />
                     </div>

                     <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowMsgModal(false)} className="px-5 py-2.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                        <button type="submit" className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium flex items-center gap-2 shadow-sm">
                            <Send size={18} /> {language === 'ar' ? 'إرسال' : 'Send Message'}
                        </button>
                    </div>
                </form>
             </div>
          </div>
      )}
      {/* ... Profile & History Modals would be here (unchanged) ... */}
      {showProfileModal && selectedProfileTenant && (
         <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary to-blue-600 p-6 text-white text-center relative">
                    <button 
                        onClick={() => setShowProfileModal(false)} 
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 shadow-lg flex items-center justify-center text-primary text-3xl font-bold border-4 border-white/20">
                        {selectedProfileTenant.name.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-bold">{selectedProfileTenant.name}</h3>
                    <p className="text-blue-100 mt-1 flex items-center justify-center gap-2">
                        <BadgeCheck size={16} /> 
                        {language === 'ar' ? 'معرف المستأجر:' : 'Tenant ID:'} {selectedProfileTenant.id}
                    </p>
                    <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedProfileTenant.status === 'active' ? 'bg-green-400/20 text-green-50 border border-green-400/30' : 
                        selectedProfileTenant.status === 'archived' ? 'bg-orange-400/20 text-orange-50 border border-orange-400/30' :
                        'bg-gray-400/20 text-gray-200 border border-gray-400/30'
                    }`}>
                        {language === 'ar' ? (selectedProfileTenant.status === 'active' ? 'نشط' : selectedProfileTenant.status === 'archived' ? 'مؤرشف' : 'غير نشط') : selectedProfileTenant.status}
                    </span>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                    
                    {/* Contact Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b dark:border-gray-700 pb-2">{language === 'ar' ? 'تفاصيل الاتصال' : 'Contact Details'}</h4>
                        <div className="space-y-3">
                             <div className="flex items-center gap-3">
                                 <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-primary dark:text-blue-400"><Mail size={16}/></div>
                                 <div className="overflow-hidden">
                                     <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</p>
                                     <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{selectedProfileTenant.email || (language === 'ar' ? 'غير متوفر' : 'Not Provided')}</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-primary dark:text-blue-400"><Phone size={16}/></div>
                                 <div>
                                     <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</p>
                                     <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{selectedProfileTenant.phone}</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-primary dark:text-blue-400"><Home size={16}/></div>
                                 <div>
                                     <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الشقة' : 'Apartment'}</p>
                                     <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{selectedProfileTenant.apartmentId || (language === 'ar' ? 'غير محدد' : 'N/A')}</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      )}

      {showHistoryModal && selectedHistoryTenant && (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                     <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'سجل المستأجر' : 'Tenant History'}</h3>
                        <p className="text-sm text-gray-500">{selectedHistoryTenant.name}</p>
                     </div>
                     <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                         <X size={20} />
                     </button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto space-y-6">
                     {/* Summary Cards */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                             <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">{language === 'ar' ? 'إجمالي الفواتير' : 'Total Invoiced'}</p>
                             <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{historySummary.invoiced.toLocaleString()} EGP</p>
                         </div>
                         <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800">
                             <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">{language === 'ar' ? 'المدفوعات' : 'Total Paid'}</p>
                             <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{historySummary.paid.toLocaleString()} EGP</p>
                         </div>
                         <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800">
                             <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">{language === 'ar' ? 'المستحق' : 'Outstanding'}</p>
                             <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{historySummary.outstanding.toLocaleString()} EGP</p>
                         </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         {/* Transaction History */}
                         <div>
                             <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                 <Tag size={18} /> {language === 'ar' ? 'المعاملات المالية' : 'Financial Transactions'}
                             </h4>
                             <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden">
                                 <div className="max-h-60 overflow-y-auto">
                                     <table className="w-full text-left text-sm">
                                         <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                                             <tr>
                                                 <th className="p-3">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                                                 <th className="p-3">{language === 'ar' ? 'النوع' : 'Type'}</th>
                                                 <th className="p-3 text-right">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y dark:divide-gray-700">
                                             {tenantTransactions.map(t => (
                                                 <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                     <td className="p-3 text-gray-600 dark:text-gray-300">{t.date}</td>
                                                     <td className="p-3 capitalize">
                                                         <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                             t.type === 'payment' ? 'bg-green-100 text-green-700' : 
                                                             t.type === 'invoice' && t.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                         }`}>
                                                             {t.type}
                                                         </span>
                                                     </td>
                                                     <td className="p-3 text-right font-medium text-gray-800 dark:text-white">{t.amount.toLocaleString()}</td>
                                                 </tr>
                                             ))}
                                             {tenantTransactions.length === 0 && (
                                                 <tr><td colSpan={3} className="p-4 text-center text-gray-500">{language === 'ar' ? 'لا توجد معاملات' : 'No transactions found'}</td></tr>
                                             )}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                         </div>

                         {/* Maintenance History */}
                         <div>
                             <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                 <Wrench size={18} /> {language === 'ar' ? 'سجل الصيانة' : 'Maintenance History'}
                             </h4>
                             <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden">
                                 <div className="max-h-60 overflow-y-auto space-y-3 p-3">
                                     {tenantMaintenance.map(m => (
                                         <div key={m.id} className="p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                                             <div className="flex justify-between items-start mb-1">
                                                 <span className="font-medium text-gray-800 dark:text-white">{m.issueType}</span>
                                                 <span className={`text-xs px-2 py-0.5 rounded ${m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                                             </div>
                                             <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.description}</p>
                                             <p className="text-xs text-gray-400">{m.dateReported}</p>
                                         </div>
                                     ))}
                                     {tenantMaintenance.length === 0 && (
                                         <p className="p-4 text-center text-gray-500 text-sm">{language === 'ar' ? 'لا توجد طلبات صيانة' : 'No maintenance requests found'}</p>
                                     )}
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
                 <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
                     <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                         {language === 'ar' ? 'إغلاق' : 'Close'}
                     </button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
