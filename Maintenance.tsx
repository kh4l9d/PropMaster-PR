
import React, { useState, useRef } from 'react';
import { MaintenanceRequest, Transaction, Vendor, Attachment, Tenant } from '../types';
import { Wrench, Clock, CheckCircle, AlertCircle, Plus, Filter, Home, User, Paperclip, X, Save, DollarSign, FileText, Image, Briefcase, Bell, Eye, Calendar, Star, Phone, Mail, MapPin, Trash2, Edit, List, Archive } from 'lucide-react';
import { MOCK_VENDORS } from '../constants';

interface MaintenanceProps {
  maintenance: MaintenanceRequest[];
  onUpdateRequest?: (req: MaintenanceRequest) => void;
  onArchiveRequest?: (id: string) => void;
  onDeleteRequest?: (id: string) => void;
  onAddTransaction?: (transaction: Transaction) => void;
  language: 'en' | 'ar';
  tenants?: Tenant[];
}

const Maintenance: React.FC<MaintenanceProps> = ({ maintenance, onUpdateRequest, onArchiveRequest, onDeleteRequest, onAddTransaction, language, tenants = [] }) => {
  const [selectedReq, setSelectedReq] = useState<MaintenanceRequest | null>(null);
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'vendors' | 'calendar'>('list');
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [dueDateFilter, setDueDateFilter] = useState<string>('');

  // Modal Edit State
  const [editForm, setEditForm] = useState<Partial<MaintenanceRequest>>({});
  const [expenseLinked, setExpenseLinked] = useState(false);
  
  // Vendor Management State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({});

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { id: 'pending', label: language === 'ar' ? 'قيد الانتظار' : 'Pending' },
    { id: 'in-progress', label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress' },
    { id: 'completed', label: language === 'ar' ? 'مكتمل' : 'Completed' },
  ];

  const uniqueVendors = Array.from(new Set([
      ...maintenance.map(m => m.assignedVendor).filter(Boolean) as string[],
      ...vendors.map(v => v.name)
  ]));

  const filteredMaintenance = maintenance.filter(m => {
    const matchesVendor = vendorFilter === 'all' ? true : m.assignedVendor === vendorFilter;
    const matchesDate = dueDateFilter ? m.dueDate === dueDateFilter : true;
    return matchesVendor && matchesDate;
  });

  const getTenantInfo = (tenantId: string) => {
      const t = tenants.find(t => t.id === tenantId);
      return t ? { name: t.name, phone: t.phone, email: t.email } : null;
  };

  const handleOpenModal = (req: MaintenanceRequest) => {
    setSelectedReq(req);
    setEditForm({ ...req });
    setExpenseLinked(false);
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
    setEditForm({});
  };

  const handleSave = () => {
    if (selectedReq && onUpdateRequest) {
      const updatedReq = {
        ...selectedReq,
        ...editForm
      } as MaintenanceRequest;

      if (updatedReq.assignedVendor && updatedReq.assignedVendor !== selectedReq.assignedVendor) {
         const message = language === 'ar' 
            ? `تم إرسال إشعار إلى ${updatedReq.assignedVendor} بتفاصيل المهمة.` 
            : `Notification sent to ${updatedReq.assignedVendor} with task details.`;
         alert(message);
      }

      onUpdateRequest(updatedReq);
    }
    handleCloseModal();
  };
  
  const handleArchive = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const msg = language === 'ar' ? 'أرشفة هذا الطلب تعني إغلاقه والاحتفاظ به في السجل. هل أنت متأكد؟' : 'Archiving this request marks it closed and keeps it for history. Sure?';
      if(window.confirm(msg)) {
          onArchiveRequest?.(id);
      }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف طلب الصيانة هذا نهائياً؟' : 'Are you sure you want to permanently delete this maintenance request?')) {
          onDeleteRequest?.(id);
      }
  };

  // Vendor Handlers...
  const handleAddVendorClick = () => {
      setVendorForm({ name: '', specialty: '', phone: '', email: '', address: '', rating: 5 });
      setIsEditingVendor(false);
      setShowVendorModal(true);
  };

  const handleEditVendorClick = (vendor: Vendor) => {
      setVendorForm({ ...vendor });
      setIsEditingVendor(true);
      setShowVendorModal(true);
  };

  const handleDeleteVendor = (id: string) => {
      if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المورد؟' : 'Are you sure you want to delete this vendor?')) {
          setVendors(prev => prev.filter(v => v.id !== id));
      }
  };

  const handleSaveVendor = (e: React.FormEvent) => {
      e.preventDefault();
      if (!vendorForm.name) return;

      const newVendor: Vendor = {
          id: isEditingVendor ? vendorForm.id! : `v-${Date.now()}`,
          name: vendorForm.name!,
          specialty: vendorForm.specialty || 'General',
          phone: vendorForm.phone || '',
          email: vendorForm.email || '',
          address: vendorForm.address || '',
          rating: Number(vendorForm.rating) || 5
      };

      if (isEditingVendor) {
          setVendors(prev => prev.map(v => v.id === newVendor.id ? newVendor : v));
      } else {
          setVendors(prev => [...prev, newVendor]);
      }
      setShowVendorModal(false);
  };

  // File Handlers...
  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments: Attachment[] = (Array.from(files) as File[]).map(file => {
          const objectUrl = URL.createObjectURL(file);
          const type = file.type.startsWith('image/') ? 'image' : 'file';
          return {
              id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              url: objectUrl,
              type: type as 'image' | 'file'
          };
      });
      
      setEditForm(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newAttachments]
      }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleViewAttachment = (att: Attachment) => {
    if (att.url && att.url !== '#') {
        window.open(att.url, '_blank');
    } else {
        alert(language === 'ar' ? `عرض المرفق: ${att.name}` : `Viewing attachment: ${att.name}`);
    }
  };

  const handleLinkToExpenses = () => {
    if (onAddTransaction && editForm.estimatedCost && editForm.estimatedCost > 0) {
      const newExpense: Transaction = {
        id: `exp-${Date.now()}`,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        amount: editForm.estimatedCost,
        description: `Maintenance Cost: ${editForm.issueType} (Req #${editForm.id})`,
        status: 'pending',
        category: 'Maintenance',
        relatedId: editForm.id
      };
      onAddTransaction(newExpense);
      setExpenseLinked(true);
    }
  };

  const renderTimeline = (status: 'pending' | 'in-progress' | 'completed', onStepClick?: (stepId: string) => void, compact: boolean = false) => {
    const currentStepIndex = steps.findIndex(s => s.id === status);
    const progressWidth = `${(currentStepIndex / (steps.length - 1)) * 100}%`;

    return (
        <div className={`w-full max-w-2xl mx-auto ${compact ? 'py-2 px-1' : 'px-4 py-6'}`}>
            <div className="relative flex justify-between items-center">
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-full bg-gray-200 dark:bg-gray-700 h-1 z-0`}></div>
                <div 
                    className={`absolute left-0 top-1/2 -translate-y-1/2 bg-green-500 h-1 z-0 transition-all duration-500 ease-in-out`}
                    style={{ width: progressWidth }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center cursor-pointer" onClick={() => onStepClick && onStepClick(step.id)}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                isCompleted 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-green-500/20 scale-110' : ''}`}>
                                {isCompleted ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                            </div>
                            {!compact && (
                                <span className={`absolute top-10 text-xs font-medium whitespace-nowrap ${
                                    isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {step.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {language === 'ar' ? 'طلبات الصيانة' : 'Maintenance Requests'}
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('vendors')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'vendors' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
                <Briefcase size={18} />
                <span>{language === 'ar' ? 'الموردين' : 'Vendors'}</span>
            </button>
            <button 
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'list' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
                <List size={18} />
                <span>{language === 'ar' ? 'القائمة' : 'Requests List'}</span>
            </button>
        </div>
      </div>

      {activeTab === 'list' && (
          <>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end transition-colors">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ... filters ... */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'تصفية حسب المورد' : 'Filter by Vendor'}</label>
                        <select 
                            className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
                            <option value="all">{language === 'ar' ? 'كل الموردين' : 'All Vendors'}</option>
                            <option value="Unassigned">{language === 'ar' ? 'غير معين' : 'Unassigned'}</option>
                            {uniqueVendors.map((v, i) => <option key={i} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'تصفية حسب تاريخ الاستحقاق' : 'Filter by Due Date'}</label>
                        <input type="date" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            value={dueDateFilter} onChange={(e) => setDueDateFilter(e.target.value)} />
                    </div>
                </div>
                <button onClick={() => { setVendorFilter('all'); setDueDateFilter(''); }} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                    {language === 'ar' ? 'مسح' : 'Clear'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaintenance.map((req) => (
                    <div key={req.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all flex flex-col cursor-pointer group ${req.status === 'archived' ? 'opacity-60 grayscale' : ''}`} onClick={() => handleOpenModal(req)}>
                        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    req.issueType === 'Plumbing' ? 'bg-blue-100 text-blue-600' :
                                    req.issueType === 'Electrical' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                                } dark:bg-opacity-20`}>
                                    <Wrench size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">{req.issueType}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: #{req.id}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                req.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                req.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                req.status === 'archived' ? 'bg-gray-200 text-gray-700 border-gray-300' :
                                'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                            }`}>
                                {language === 'ar' 
                                  ? (req.status === 'completed' ? 'مكتمل' : req.status === 'in-progress' ? 'قيد التنفيذ' : req.status === 'archived' ? 'مؤرشف' : 'قيد الانتظار')
                                  : req.status}
                            </span>
                        </div>
                        
                        <div className="p-5 flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{req.description}</p>
                            
                            {/* Mini Timeline (hide if archived) */}
                            {req.status !== 'archived' && (
                                <div className="mb-4 pointer-events-none opacity-80 scale-90 origin-left -ml-2">
                                    {renderTimeline(req.status as any, undefined, true)}
                                </div>
                            )}

                            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Home size={14} /> Apt {req.apartmentId}
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={14} /> {getTenantInfo(req.tenantId)?.name || req.tenantId}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} /> Reported: {req.dateReported}
                                </div>
                                {req.assignedVendor && (
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                        <Briefcase size={14} /> {req.assignedVendor}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 border-t dark:border-gray-700 flex justify-between items-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Eye size={14} /> {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                            </span>
                            <div className="flex gap-2">
                                {req.status !== 'archived' && (
                                    <button 
                                        onClick={(e) => handleArchive(e, req.id)}
                                        className="p-1 text-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                                        title={language === 'ar' ? 'أرشفة' : 'Archive'}
                                    >
                                        <Archive size={16} />
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => handleDelete(e, req.id)}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title={language === 'ar' ? 'حذف' : 'Delete'}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </>
      )}

      {/* Vendors and Modal sections remain unchanged */}
      {activeTab === 'vendors' && (
          <div className="space-y-6">
              {/* ... vendor list ... */}
              <div className="flex justify-end">
                  <button onClick={handleAddVendorClick} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                      <Plus size={18} />
                      <span>{language === 'ar' ? 'إضافة مورد جديد' : 'Add New Vendor'}</span>
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendors.map(vendor => (
                      <div key={vendor.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all">
                          <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">{vendor.name.charAt(0)}</div>
                                  <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-xs font-bold text-yellow-700 dark:text-yellow-400"><Star size={12} fill="currentColor" /> {vendor.rating}</div>
                              </div>
                              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{vendor.name}</h3>
                              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-4">{vendor.specialty}</p>
                              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-2"><Phone size={14} /> {vendor.phone}</div>
                                  {vendor.email && <div className="flex items-center gap-2"><Mail size={14} /> {vendor.email}</div>}
                                  {vendor.address && <div className="flex items-center gap-2"><MapPin size={14} /> {vendor.address}</div>}
                              </div>
                          </div>
                          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end gap-2">
                              <button onClick={() => handleEditVendorClick(vendor)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit size={18} /></button>
                              <button onClick={() => handleDeleteVendor(vendor.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Edit Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                 {/* ... modal header ... */}
                 <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                     <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${editForm.issueType === 'Plumbing' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}><Wrench size={24} /></div>
                         <div><h3 className="text-xl font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'طلب صيانة' : 'Maintenance Request'}</h3><p className="text-xs text-gray-500">#{selectedReq.id}</p></div>
                     </div>
                     <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
                 </div>

                 <div className="p-6 overflow-y-auto space-y-6">
                     {/* Progress Timeline in Modal (only if not archived) */}
                     {editForm.status !== 'archived' && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">{language === 'ar' ? 'حالة الطلب' : 'Request Status'}</h4>
                            {renderTimeline(editForm.status as any, (stepId) => setEditForm({...editForm, status: stepId as any}))}
                        </div>
                     )}
                     {editForm.status === 'archived' && (
                         <div className="bg-gray-100 p-4 rounded text-center text-gray-500">{language === 'ar' ? 'هذا الطلب مؤرشف' : 'This request is archived'}</div>
                     )}

                     {/* ... rest of modal fields ... */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المورد المعين' : 'Assigned Vendor'}</label>
                             <select className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={editForm.assignedVendor || ''} onChange={(e) => setEditForm({...editForm, assignedVendor: e.target.value})}>
                                 <option value="">{language === 'ar' ? '-- تعيين مورد --' : '-- Assign Vendor --'}</option>
                                 {vendors.map(v => <option key={v.id} value={v.name}>{v.name} ({v.specialty})</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                             <input type="date" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={editForm.dueDate || ''} onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'التكلفة التقديرية (EGP)' : 'Estimated Cost (EGP)'}</label>
                             <div className="relative">
                                 <DollarSign size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                                 <input type="number" className={`w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
                                    value={editForm.estimatedCost || ''} onChange={(e) => setEditForm({...editForm, estimatedCost: parseFloat(e.target.value)})} />
                             </div>
                         </div>
                         <div className="flex items-end">
                             <button onClick={handleLinkToExpenses} disabled={expenseLinked || !editForm.estimatedCost} className={`w-full py-2.5 rounded-lg border border-dashed flex items-center justify-center gap-2 transition-all ${expenseLinked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 text-green-600 cursor-default' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                 {expenseLinked ? <CheckCircle size={16} /> : <DollarSign size={16} />}
                                 {expenseLinked ? (language === 'ar' ? 'تم ربط المصروف' : 'Expense Linked') : (language === 'ar' ? 'تسجيل كمصروف' : 'Log as Expense')}
                             </button>
                         </div>
                         <div className="col-span-full">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                             <textarea className="w-full border dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" rows={3}
                                value={editForm.description || ''} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
                         </div>
                     </div>

                     {/* Attachments Section */}
                     <div>
                         <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'المرفقات' : 'Attachments'}</label>
                             <button onClick={handleTriggerFileUpload} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                                 <Plus size={14} /> {language === 'ar' ? 'إضافة ملف' : 'Add File'}
                             </button>
                             <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                         </div>
                         
                         {editForm.attachments && editForm.attachments.length > 0 ? (
                             <div className="grid grid-cols-2 gap-3">
                                 {editForm.attachments.map(att => (
                                     <div key={att.id} className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" onClick={() => handleViewAttachment(att)}>
                                         <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-500 dark:text-gray-300">
                                             {att.type === 'image' ? <Image size={20} /> : <FileText size={20} />}
                                         </div>
                                         <div className="overflow-hidden">
                                             <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{att.name}</p>
                                             <p className="text-xs text-blue-500">{language === 'ar' ? 'عرض' : 'View'}</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         ) : (
                             <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
                                 {language === 'ar' ? 'لا توجد مرفقات حتى الآن.' : 'No attachments yet.'}
                             </div>
                         )}
                     </div>
                 </div>

                 <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                     <button onClick={handleCloseModal} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                     <button onClick={handleSave} className="px-4 py-2 bg-primary text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 shadow-sm">
                         <Save size={18} /> {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* Vendor Add/Edit Modal (unchanged) */}
      {/* ... */}
    </div>
  );
};

export default Maintenance;
