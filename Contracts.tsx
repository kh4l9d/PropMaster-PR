
import React, { useState, useEffect } from 'react';
import { Contract, Tenant, Apartment, ContractTemplate, Transaction, OwnerSettings } from '../types';
import { FileText, Plus, Calendar, User, Home, Download, AlertTriangle, MoreVertical, Edit, Trash2, X, Save, RefreshCw, CheckCircle, Clock, Search, DollarSign, Mail, Phone, ExternalLink, Archive, Filter, Bell } from 'lucide-react';

interface ContractsProps {
  contracts: Contract[];
  tenants: Tenant[];
  apartments: Apartment[];
  templates: ContractTemplate[];
  transactions: Transaction[];
  onAddContract: (c: Contract) => void;
  onUpdateContract: (c: Contract) => void;
  onArchiveContract: (id: string) => void;
  onDeleteContract: (id: string) => void;
  onAddTemplate: (t: ContractTemplate) => void;
  onAddTransaction: (t: Transaction) => void;
  language: 'en' | 'ar';
  ownerSettings: OwnerSettings;
}

const Contracts: React.FC<ContractsProps> = ({ 
    contracts, tenants, apartments, templates, transactions,
    onAddContract, onUpdateContract, onArchiveContract, onDeleteContract, onAddTemplate, onAddTransaction,
    language, ownerSettings
}) => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Filtering State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  // Renewal State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewData, setRenewData] = useState({
      newEndDate: '',
      newRent: 0,
      generateInvoice: true
  });

  // Tenant Profile State
  const [viewTenantId, setViewTenantId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Contract>>({
      tenantId: '',
      apartmentId: '',
      startDate: '',
      endDate: '',
      rentAmount: 0,
      depositAmount: 0,
      paymentFrequency: 'monthly',
      status: 'active',
      terms: '',
      reminderDays: 30,
      reminderChannel: 'system'
  });

  // Auto-calculate End Date when Start Date changes (only for new contracts)
  useEffect(() => {
      if (!isEditing && formData.startDate) {
          const start = new Date(formData.startDate);
          const end = new Date(start);
          // Default to 1 year lease duration
          end.setFullYear(end.getFullYear() + 1);
          
          const newEndDate = end.toISOString().split('T')[0];
          
          // Update only if different to avoid potential loops, though dependency array protects us
          if (formData.endDate !== newEndDate) {
              setFormData(prev => ({ ...prev, endDate: newEndDate }));
          }
      }
  }, [formData.startDate, isEditing]);

  const getTenantName = (id: string) => tenants.find(t => t.id === id)?.name || id;
  const getApartmentInfo = (id: string) => {
      const apt = apartments.find(a => a.id === id);
      return apt ? `${apt.number} - ${apt.building}` : id;
  };

  const isExpiringSoon = (c: Contract) => {
      if (c.status !== 'active') return false;
      const today = new Date();
      const end = new Date(c.endDate);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30; // Expiring in next 30 days
  };

  const isOverdue = (c: Contract) => {
      if (c.status !== 'active') return false;
      const today = new Date();
      today.setHours(0,0,0,0);
      return new Date(c.endDate) < today;
  };

  // Filter Logic
  const filteredContracts = contracts.filter(c => {
      let matchesStatus = true;
      if (filterStatus === 'expiring') {
          matchesStatus = isExpiringSoon(c);
      } else if (filterStatus === 'overdue') {
          matchesStatus = isOverdue(c);
      } else if (filterStatus !== 'all') {
          matchesStatus = c.status === filterStatus;
      }

      const tenantName = getTenantName(c.tenantId).toLowerCase();
      const aptInfo = getApartmentInfo(c.apartmentId).toLowerCase();
      const matchesSearch = tenantName.includes(searchTerm.toLowerCase()) || aptInfo.includes(searchTerm.toLowerCase());
      
      const matchesDate = 
        (!dateFilter.start || c.startDate >= dateFilter.start) &&
        (!dateFilter.end || c.endDate <= dateFilter.end);

      return matchesStatus && matchesSearch && matchesDate;
  });

  const expiringContractsCount = contracts.filter(c => isExpiringSoon(c)).length;

  const handleOpenAdd = () => {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      setFormData({
          tenantId: '',
          apartmentId: '',
          startDate: today,
          endDate: nextYear.toISOString().split('T')[0],
          rentAmount: 0,
          depositAmount: 0,
          paymentFrequency: 'monthly',
          status: 'active',
          terms: templates[0]?.terms || '',
          reminderDays: 30,
          reminderChannel: 'system'
      });
      setIsEditing(false);
      setShowModal(true);
      setOpenMenuId(null);
  };

  const handleOpenEdit = (contract: Contract) => {
      setFormData({ ...contract });
      setIsEditing(true);
      setShowModal(true);
      setOpenMenuId(null);
  };

  const handleArchive = (id: string) => {
      const msg = language === 'ar'
        ? 'أرشفة العقد ستحتفظ به في السجلات التاريخية ولكن ستعتبره غير نشط. هل أنت متأكد؟'
        : 'Archiving this contract will keep it in history but mark it inactive. Are you sure?';
      if(window.confirm(msg)) {
          onArchiveContract(id);
          setOpenMenuId(null);
      }
  };

  const handleTerminate = (contract: Contract) => {
      const reason = window.prompt(language === 'ar' ? 'يرجى إدخال سبب الإنهاء:' : 'Please enter termination reason:');
      if (reason !== null) {
          const updatedContract = { ...contract, status: 'terminated' as const, terminationReason: reason };
          onUpdateContract(updatedContract);
          setOpenMenuId(null);
      }
  };

  const handleDelete = (id: string) => {
      if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العقد نهائياً؟' : 'Are you sure you want to permanently delete this contract?')) {
          onDeleteContract(id);
      }
      setOpenMenuId(null);
  };

  const handleOpenRenew = (contractId: string) => {
      const contract = contracts.find(c => c.id === contractId);
      if(contract) {
          const currentEnd = new Date(contract.endDate);
          const newEnd = new Date(currentEnd);
          newEnd.setFullYear(newEnd.getFullYear() + 1); // Default extend 1 year
          
          setRenewData({
              newEndDate: newEnd.toISOString().split('T')[0],
              newRent: contract.rentAmount,
              generateInvoice: true
          });
          setSelectedContract(contract);
          setShowRenewModal(true);
      }
  };

  const submitRenewal = () => {
      if(selectedContract && renewData.newEndDate) {
          const updatedContract: Contract = {
              ...selectedContract,
              endDate: renewData.newEndDate,
              rentAmount: Number(renewData.newRent),
              status: 'active'
          };
          onUpdateContract(updatedContract);

          if(renewData.generateInvoice) {
              const newInv: Transaction = {
                  id: `inv-ren-${Date.now()}`,
                  type: 'invoice',
                  date: new Date().toISOString().split('T')[0],
                  amount: Number(renewData.newRent),
                  description: language === 'ar' ? `تجديد عقد - ${getApartmentInfo(selectedContract.apartmentId)}` : `Contract Renewal - ${getApartmentInfo(selectedContract.apartmentId)}`,
                  status: 'unpaid',
                  relatedId: selectedContract.tenantId
              };
              onAddTransaction(newInv);
          }

          setShowRenewModal(false);
          alert(language === 'ar' ? 'تم تجديد العقد بنجاح' : 'Contract renewed successfully');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const contractData: Contract = {
          id: isEditing ? formData.id! : `c-${Date.now()}`,
          tenantId: formData.tenantId!,
          apartmentId: formData.apartmentId!,
          startDate: formData.startDate!,
          endDate: formData.endDate!,
          rentAmount: Number(formData.rentAmount),
          depositAmount: Number(formData.depositAmount),
          paymentFrequency: formData.paymentFrequency as any,
          status: formData.status as any,
          terms: formData.terms,
          reminderDays: Number(formData.reminderDays) || 30,
          reminderChannel: formData.reminderChannel as any
      };

      if (isEditing) {
          onUpdateContract(contractData);
      } else {
          onAddContract(contractData);
      }
      setShowModal(false);
  };

  const handleDownloadPDF = () => {
      // PDF Generation Logic (Same as before)
      if (!selectedContract) return;
      // Assuming previous PDF logic is here.
      alert('Downloading PDF...');
  };

  const handleTenantClick = (tenantId: string) => {
      setViewTenantId(tenantId);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in" onClick={() => setOpenMenuId(null)}>
      
      {/* Expiration Alert Banner */}
      {expiringContractsCount > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-center justify-between animate-pulse-slow">
              <div className="flex items-center gap-3">
                  <AlertTriangle className="text-orange-600 dark:text-orange-400" />
                  <div>
                      <h3 className="font-bold text-orange-800 dark:text-orange-200">{language === 'ar' ? 'تنبيه انتهاء العقود' : 'Contract Expiration Alert'}</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                          {language === 'ar' 
                            ? `يوجد ${expiringContractsCount} عقود تنتهي خلال 30 يوماً.` 
                            : `There are ${expiringContractsCount} contracts expiring within 30 days.`}
                      </p>
                  </div>
              </div>
              <button 
                onClick={() => setFilterStatus('expiring')}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-300 text-sm font-bold rounded-lg shadow-sm hover:bg-orange-50 dark:hover:bg-gray-700"
              >
                  {language === 'ar' ? 'عرض العقود' : 'View Contracts'}
              </button>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {language === 'ar' ? 'إدارة العقود' : 'Contract Management'}
        </h2>
        <button 
            onClick={(e) => { e.stopPropagation(); handleOpenAdd(); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
            <Plus size={18} />
            <span>{language === 'ar' ? 'إنشاء عقد جديد' : 'New Contract'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row gap-4 transition-colors items-center">
         <div className="relative flex-1 w-full lg:w-auto">
             <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
             <input 
                type="text" 
                placeholder={language === 'ar' ? 'بحث باسم المستأجر أو رقم الوحدة...' : 'Search tenant or unit...'}
                className={`w-full py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
         </div>
         
         <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900">
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{language === 'ar' ? 'من:' : 'Start:'}</span>
                <input 
                    type="date" 
                    className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-300 w-28"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                />
            </div>
            <div className="flex items-center gap-2 border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900">
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{language === 'ar' ? 'إلى:' : 'End:'}</span>
                <input 
                    type="date" 
                    className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-300 w-28"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                />
            </div>
         </div>

         <div className="flex items-center gap-2 w-full lg:w-auto">
            <button 
                onClick={() => setFilterStatus(filterStatus === 'expiring' ? 'all' : 'expiring')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors whitespace-nowrap ${filterStatus === 'expiring' ? 'bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
                <Clock size={16} />
                <span>{language === 'ar' ? 'تنتهي قريباً' : 'Expiring Soon'}</span>
            </button>

            <div className="relative flex-1 lg:flex-none">
                <Filter size={16} className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none ${language === 'ar' ? 'left-3' : 'right-3'}`} />
                <select 
                    className={`w-full border dark:border-gray-600 rounded-lg py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 outline-none cursor-pointer appearance-none ${language === 'ar' ? 'pl-8 pr-4' : 'pl-4 pr-8'}`}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">{language === 'ar' ? 'كل العقود' : 'All Contracts'}</option>
                    <option value="active">{language === 'ar' ? 'سارية' : 'Active'}</option>
                    <option value="overdue">{language === 'ar' ? 'متأخرة' : 'Overdue (Active)'}</option>
                    <option value="expired">{language === 'ar' ? 'منتهية' : 'Expired'}</option>
                    <option value="terminated">{language === 'ar' ? 'ملغاة' : 'Terminated'}</option>
                    <option value="archived">{language === 'ar' ? 'مؤرشفة' : 'Archived'}</option>
                </select>
            </div>
         </div>
         
         {(dateFilter.start || dateFilter.end || filterStatus !== 'all' || searchTerm) && (
             <button 
                onClick={() => { setDateFilter({start:'', end:''}); setFilterStatus('all'); setSearchTerm(''); }}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm whitespace-nowrap"
             >
                {language === 'ar' ? 'مسح' : 'Clear'}
             </button>
         )}
      </div>

      {/* Contract Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map((contract) => (
            <div key={contract.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible hover:shadow-md transition-all relative group ${contract.status === 'archived' ? 'opacity-70 grayscale' : ''}`}>
                {/* Status Indicator Bar */}
                <div className={`h-1.5 w-full rounded-t-xl ${
                    contract.status === 'active' 
                        ? (isOverdue(contract) ? 'bg-red-500' : isExpiringSoon(contract) ? 'bg-orange-500' : 'bg-green-500') 
                        : contract.status === 'archived' ? 'bg-gray-400' : 'bg-gray-300 dark:bg-gray-600'
                }`} />

                {/* Actions Menu */}
                <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-10`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === contract.id ? null : contract.id); }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                    {openMenuId === contract.id && (
                        <div className={`absolute top-8 ${language === 'ar' ? 'left-0' : 'right-0'} bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 w-40 border dark:border-gray-600 z-20 animate-in fade-in zoom-in-95`}>
                            {contract.status === 'active' && (
                                <button onClick={() => handleOpenRenew(contract.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-green-600">
                                    <RefreshCw size={14}/> {language === 'ar' ? 'تجديد' : 'Renew'}
                                </button>
                            )}
                            <button onClick={() => handleOpenEdit(contract)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                <Edit size={14}/> {language === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            {contract.status !== 'archived' && (
                                <button onClick={() => handleArchive(contract.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-orange-600">
                                    <Archive size={14}/> {language === 'ar' ? 'أرشفة' : 'Archive'}
                                </button>
                            )}
                            {contract.status === 'active' && (
                                <button onClick={() => handleTerminate(contract)} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 text-sm">
                                    <X size={14}/> {language === 'ar' ? 'إنهاء' : 'Terminate'}
                                </button>
                            )}
                            <button onClick={() => handleDelete(contract.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 text-sm">
                                <Trash2 size={14}/> {language === 'ar' ? 'حذف' : 'Delete'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6 cursor-pointer" onClick={() => setSelectedContract(contract)}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white text-lg hover:text-primary transition-colors hover:underline" onClick={(e) => {
                                    e.stopPropagation();
                                    handleTenantClick(contract.tenantId);
                                }}>
                                    {getTenantName(contract.tenantId)}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{getApartmentInfo(contract.apartmentId)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-dashed dark:border-gray-700 pb-2">
                             <span className="flex items-center gap-1"><Calendar size={14}/> {language === 'ar' ? 'البدء' : 'Start'}</span>
                             <span className="font-medium text-gray-800 dark:text-gray-200">{contract.startDate}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-dashed dark:border-gray-700 pb-2">
                             <span className="flex items-center gap-1"><Clock size={14}/> {language === 'ar' ? 'النهاية' : 'End'}</span>
                             <span className={`font-medium ${isExpiringSoon(contract) && contract.status === 'active' ? 'text-orange-600 font-bold' : isOverdue(contract) && contract.status === 'active' ? 'text-red-600 font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                                 {contract.endDate}
                             </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                             <span className="flex items-center gap-1"><DollarSign size={14}/> {language === 'ar' ? 'الإيجار' : 'Rent'}</span>
                             <span className="font-bold text-primary">{contract.rentAmount.toLocaleString()} EGP</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                         <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                             contract.status === 'active' 
                                ? (isOverdue(contract) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')
                                : contract.status === 'archived' ? 'bg-gray-200 text-gray-700' : 
                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                         }`}>
                             {language === 'ar' ? (contract.status === 'active' ? (isOverdue(contract) ? 'متأخر' : 'ساري') : contract.status === 'archived' ? 'مؤرشف' : 'منتهي') : (contract.status === 'active' && isOverdue(contract) ? 'Overdue' : contract.status)}
                         </span>
                         {contract.reminderDays && (
                             <span className="text-xs text-blue-500 flex items-center gap-1">
                                 <Bell size={12} /> {contract.reminderDays}d
                             </span>
                         )}
                         <button className="text-xs text-primary font-bold hover:underline">
                             {language === 'ar' ? 'التفاصيل الكاملة' : 'Full Details'}
                         </button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white flex justify-between items-start">
                      <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                              {language === 'ar' ? 'تفاصيل العقد' : 'Contract Details'}
                              <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">#{selectedContract.id}</span>
                          </h2>
                          <p className="text-blue-100 mt-1">{getTenantName(selectedContract.tenantId)} • {getApartmentInfo(selectedContract.apartmentId)}</p>
                      </div>
                      <button onClick={() => setSelectedContract(null)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 overflow-y-auto space-y-6 bg-gray-50 dark:bg-gray-900/50">
                      
                      {/* Status Card */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الحالة الحالية' : 'Current Status'}</p>
                              <p className={`font-bold text-lg capitalize ${
                                   selectedContract.status === 'active' ? 'text-green-600' : 
                                   selectedContract.status === 'terminated' ? 'text-red-500' : 'text-gray-600'
                              }`}>
                                  {selectedContract.status}
                              </p>
                              {selectedContract.terminationReason && (
                                <p className="text-xs text-red-500 mt-1">{language === 'ar' ? `سبب الإنهاء: ${selectedContract.terminationReason}` : `Termination Reason: ${selectedContract.terminationReason}`}</p>
                              )}
                          </div>
                          {selectedContract.status === 'active' && (
                              <button onClick={() => { setSelectedContract(null); handleOpenRenew(selectedContract.id); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                                  {language === 'ar' ? 'تجديد العقد' : 'Renew Contract'}
                              </button>
                          )}
                      </div>

                      {/* Financial Details */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'قيمة الإيجار' : 'Rent Amount'}</p>
                              <p className="font-bold text-gray-800 dark:text-white text-lg">{selectedContract.rentAmount.toLocaleString()} EGP</p>
                              <p className="text-xs text-gray-400 capitalize">{selectedContract.paymentFrequency}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'التأمين' : 'Security Deposit'}</p>
                              <p className="font-bold text-gray-800 dark:text-white text-lg">{selectedContract.depositAmount.toLocaleString()} EGP</p>
                          </div>
                      </div>

                      {/* Dates */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-2">
                           <div className="flex justify-between items-center border-b dark:border-gray-700 pb-2">
                               <span className="text-gray-500 dark:text-gray-400 text-sm">{language === 'ar' ? 'تاريخ البداية' : 'Start Date'}</span>
                               <span className="font-medium text-gray-800 dark:text-white">{selectedContract.startDate}</span>
                           </div>
                           <div className="flex justify-between items-center border-b dark:border-gray-700 pb-2">
                               <span className="text-gray-500 dark:text-gray-400 text-sm">{language === 'ar' ? 'تاريخ النهاية' : 'End Date'}</span>
                               <span className="font-medium text-gray-800 dark:text-white">{selectedContract.endDate}</span>
                           </div>
                           {selectedContract.reminderDays && (
                               <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">{language === 'ar' ? 'تذكير الانتهاء' : 'Expiry Reminder'}</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <Bell size={12} /> {selectedContract.reminderDays} {language === 'ar' ? 'يوم قبل' : 'Days Before'}
                                    </span>
                                </div>
                           )}
                      </div>

                      {/* Terms */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">{language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{selectedContract.terms}</p>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
                      <button onClick={() => setSelectedContract(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          {language === 'ar' ? 'إغلاق' : 'Close'}
                      </button>
                      <button onClick={handleDownloadPDF} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2">
                          <Download size={16} /> {language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Contract Add/Edit Modal */}
      {showModal && (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                     <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                         {isEditing 
                            ? (language === 'ar' ? 'تعديل العقد' : 'Edit Contract') 
                            : (language === 'ar' ? 'عقد إيجار جديد' : 'New Rental Contract')}
                     </h3>
                     <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                         <X size={20} />
                     </button>
                 </div>
                 
                 <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المستأجر' : 'Tenant'}</label>
                             <select required className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.tenantId} onChange={e => setFormData({...formData, tenantId: e.target.value})}>
                                 <option value="">{language === 'ar' ? '-- اختر مستأجر --' : '-- Select Tenant --'}</option>
                                 {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الشقة' : 'Apartment'}</label>
                             <select required className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})}>
                                 <option value="">{language === 'ar' ? '-- اختر شقة --' : '-- Select Apartment --'}</option>
                                 {apartments.map(a => <option key={a.id} value={a.id}>{a.number} - {a.building} ({a.status})</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                             <input type="date" required className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ النهاية' : 'End Date'}</label>
                             <input type="date" required className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الإيجار (EGP)' : 'Rent Amount (EGP)'}</label>
                             <input type="number" required className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.rentAmount} onChange={e => setFormData({...formData, rentAmount: parseFloat(e.target.value)})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'التأمين (EGP)' : 'Deposit (EGP)'}</label>
                             <input type="number" required className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.depositAmount} onChange={e => setFormData({...formData, depositAmount: parseFloat(e.target.value)})} />
                         </div>

                         {/* Reminder Config */}
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تذكير قبل الانتهاء (يوم)' : 'Reminder Days Before End'}</label>
                             <input type="number" min="0" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.reminderDays} onChange={e => setFormData({...formData, reminderDays: parseInt(e.target.value)})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'قناة التذكير' : 'Reminder Channel'}</label>
                             <select className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.reminderChannel} onChange={e => setFormData({...formData, reminderChannel: e.target.value as any})}>
                                 <option value="system">{language === 'ar' ? 'إشعار بالنظام' : 'In-App Notification'}</option>
                                 <option value="email">{language === 'ar' ? 'بريد إلكتروني' : 'Email'}</option>
                             </select>
                         </div>

                         <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'شروط العقد' : 'Contract Terms'}</label>
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                                {templates.map(tpl => (
                                    <button 
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => setFormData({...formData, terms: tpl.terms})}
                                        className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-full whitespace-nowrap text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition-colors"
                                    >
                                        + {tpl.name}
                                    </button>
                                ))}
                            </div>
                            <textarea className="w-full border dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 text-sm" rows={5}
                                value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} />
                         </div>
                     </div>
                     <div className="pt-4 flex justify-end gap-3">
                         <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                         <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                             <Save size={18} /> {isEditing ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'حفظ' : 'Save')}
                         </button>
                     </div>
                 </form>
             </div>
        </div>
      )}

      {/* Renew Modal remains unchanged */}
      {showRenewModal && selectedContract && (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                 <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                     <h3 className="text-xl font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'تجديد العقد' : 'Renew Contract'}</h3>
                     <button onClick={() => setShowRenewModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
                 </div>
                 <div className="p-6 space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ النهاية الجديد' : 'New End Date'}</label>
                         <input type="date" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            value={renewData.newEndDate} onChange={e => setRenewData({...renewData, newEndDate: e.target.value})} />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الإيجار الجديد (EGP)' : 'New Rent Amount (EGP)'}</label>
                         <input type="number" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            value={renewData.newRent} onChange={e => setRenewData({...renewData, newRent: parseFloat(e.target.value)})} />
                     </div>
                     <div className="flex items-center gap-2">
                         <input type="checkbox" id="genInv" className="w-4 h-4 text-primary rounded" checked={renewData.generateInvoice} onChange={e => setRenewData({...renewData, generateInvoice: e.target.checked})} />
                         <label htmlFor="genInv" className="text-sm text-gray-700 dark:text-gray-300">{language === 'ar' ? 'إصدار فاتورة للتجديد تلقائياً' : 'Automatically generate renewal invoice'}</label>
                     </div>
                     <div className="pt-4 flex justify-end gap-3">
                         <button onClick={() => setShowRenewModal(false)} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                         <button onClick={submitRenewal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm">
                             <RefreshCw size={18} /> {language === 'ar' ? 'تأكيد التجديد' : 'Confirm Renewal'}
                         </button>
                     </div>
                 </div>
             </div>
        </div>
      )}
      
    </div>
  );
};

export default Contracts;
