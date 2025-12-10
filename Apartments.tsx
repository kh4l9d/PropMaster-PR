
import React, { useState, useEffect, useMemo } from 'react';
import { Apartment, Tenant, MaintenanceRequest } from '../types';
import { Search, Plus, Home, MapPin, Maximize, Info, X, User, History, Wrench, BedDouble, Layers, MoreVertical, Edit, Trash2, Save, Archive } from 'lucide-react';

interface ApartmentsProps {
  apartments: Apartment[];
  tenants?: Tenant[];
  maintenance?: MaintenanceRequest[];
  onAddApartment: (apt: Apartment) => void;
  onUpdateApartment: (apt: Apartment) => void;
  onArchiveApartment: (id: string) => void;
  onDeleteApartment: (id: string) => void;
  language: 'en' | 'ar';
}

const Apartments: React.FC<ApartmentsProps> = ({ apartments, tenants = [], maintenance = [], onAddApartment, onUpdateApartment, onArchiveApartment, onDeleteApartment, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  // Menu & Modal State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Apartment>>({
      number: '',
      building: '',
      floor: 0,
      size: 0,
      rooms: 1,
      rentAmount: 0,
      status: 'vacant',
      tenantId: ''
  });

  // Automatically update status when tenantId changes
  useEffect(() => {
    if (showAddEditModal) {
        if (formData.tenantId && formData.status === 'vacant') {
            setFormData(prev => ({ ...prev, status: 'occupied' }));
        } else if (!formData.tenantId && formData.status === 'occupied') {
             setFormData(prev => ({ ...prev, status: 'vacant' }));
        }
    }
  }, [formData.tenantId, showAddEditModal]);

  const filteredApartments = apartments.filter(apt => 
    (filterStatus === 'all' || apt.status === filterStatus) &&
    (apt.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
     apt.building.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableTenants = useMemo(() => {
      return tenants.filter(t => 
          t.status === 'active' && 
          (!t.apartmentId || (isEditing && formData.id && t.apartmentId === formData.id))
      );
  }, [tenants, isEditing, formData.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'vacant': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'reserved': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'archived': return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
      if (language !== 'ar') return status;
      switch (status) {
          case 'occupied': return 'مشغول';
          case 'vacant': return 'شاغر';
          case 'reserved': return 'محجوز';
          case 'archived': return 'مؤرشف';
          default: return status;
      }
  };

  const getCurrentTenant = (tenantId?: string) => {
      return tenants.find(t => t.id === tenantId);
  };

  const getApartmentMaintenance = (apartmentId: string) => {
      return maintenance.filter(m => m.apartmentId === apartmentId);
  };

  const handleOpenAdd = () => {
      setFormData({
          number: '', building: '', floor: 0, size: 0, rooms: 1, rentAmount: 0, status: 'vacant', tenantId: ''
      });
      setIsEditing(false);
      setShowAddEditModal(true);
      setOpenMenuId(null);
  };

  const handleOpenEdit = (apt: Apartment) => {
      setFormData({...apt});
      setIsEditing(true);
      setShowAddEditModal(true);
      setOpenMenuId(null);
  };

  const handleArchive = (id: string) => {
      const msg = language === 'ar' 
        ? 'أرشفة هذه الشقة ستجعلها "مؤرشفة" ولن تكون متاحة للإيجار. هل أنت متأكد؟'
        : 'Archiving this apartment will mark it as "Archived" and unavailable for rent. Are you sure?';
      if(window.confirm(msg)) {
          onArchiveApartment(id);
          setOpenMenuId(null);
      }
  };

  const handleDelete = (id: string) => {
      const warning = language === 'ar'
        ? 'تحذير: حذف الشقة سيؤدي إلى إنهاء أي عقود نشطة مرتبطة بها. هل أنت متأكد؟'
        : 'WARNING: Deleting this apartment will terminate any active contracts associated with it. Are you sure?';

      if(window.confirm(warning)) {
          onDeleteApartment(id);
          setOpenMenuId(null);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const aptData: Apartment = {
          id: isEditing ? formData.id! : `a${Date.now()}`,
          number: formData.number!,
          building: formData.building!,
          floor: Number(formData.floor),
          size: Number(formData.size),
          rooms: Number(formData.rooms),
          rentAmount: Number(formData.rentAmount),
          status: formData.status as any,
          tenantId: formData.tenantId
      };

      if (isEditing) {
          onUpdateApartment(aptData);
      } else {
          onAddApartment(aptData);
      }
      setShowAddEditModal(false);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in" onClick={() => setOpenMenuId(null)}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {language === 'ar' ? 'إدارة الشقق' : 'Apartments Management'}
        </h2>
        <button 
            onClick={(e) => { e.stopPropagation(); handleOpenAdd(); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
            <Plus size={18} />
            <span>{language === 'ar' ? 'إضافة شقة' : 'Add Apartment'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 transition-colors">
         <div className="relative flex-1">
             <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
             <input 
                type="text" 
                placeholder={language === 'ar' ? 'بحث برقم الشقة أو المبنى...' : 'Search by apartment or building...'}
                className={`w-full py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
         </div>
         <select 
            className={`border dark:border-gray-600 rounded-lg px-4 py-2 text-gray-600 dark:text-gray-300 bg-transparent focus:outline-none cursor-pointer ${language === 'ar' ? 'text-right' : 'text-left'}`}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
         >
             <option value="all">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
             <option value="occupied">{language === 'ar' ? 'مشغول' : 'Occupied'}</option>
             <option value="vacant">{language === 'ar' ? 'شاغر' : 'Vacant'}</option>
             <option value="reserved">{language === 'ar' ? 'محجوز' : 'Reserved'}</option>
             <option value="archived">{language === 'ar' ? 'مؤرشف' : 'Archived'}</option>
         </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApartments.map((apt) => (
            <div key={apt.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible hover:shadow-md transition-all group relative ${apt.status === 'archived' ? 'opacity-75 grayscale' : ''}`}>
                <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} z-10`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === apt.id ? null : apt.id); }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                    {openMenuId === apt.id && (
                        <div 
                            className={`absolute top-8 ${language === 'ar' ? 'left-0' : 'right-0'} bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 w-32 border dark:border-gray-600 animate-in fade-in zoom-in-95 duration-100 z-20`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => handleOpenEdit(apt)} 
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                            >
                                <Edit size={14}/> {language === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            {apt.status !== 'archived' && (
                                <button 
                                    onClick={() => handleArchive(apt.id)} 
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-orange-600"
                                >
                                    <Archive size={14}/> {language === 'ar' ? 'أرشفة' : 'Archive'}
                                </button>
                            )}
                            <button 
                                onClick={() => handleDelete(apt.id)} 
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
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-primary dark:text-blue-400">
                                <Home size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white text-lg">{apt.number}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{apt.building}</p>
                            </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(apt.status)}`}>
                            {getStatusLabel(apt.status)}
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 pb-2 border-dashed">
                             <span>{language === 'ar' ? 'الطابق' : 'Floor'}</span>
                             <span className="font-medium text-gray-800 dark:text-gray-200">{apt.floor}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 pb-2 border-dashed">
                             <span>{language === 'ar' ? 'المساحة' : 'Size'}</span>
                             <span className="font-medium text-gray-800 dark:text-gray-200">{apt.size} m²</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                             <span>{language === 'ar' ? 'الإيجار' : 'Rent'}</span>
                             <span className="font-bold text-primary">{apt.rentAmount.toLocaleString()} EGP</span>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {apt.tenantId ? (language === 'ar' ? 'مؤجر' : 'Tenant Assigned') : (language === 'ar' ? 'لا يوجد مستأجر' : 'No Tenant')}
                    </span>
                    <button 
                        onClick={() => setSelectedApartment(apt)}
                        className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                    >
                        {language === 'ar' ? 'التفاصيل' : 'View Details'}
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* Add/Edit Apartment Modal */}
      {showAddEditModal && (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                     <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                         {isEditing 
                            ? (language === 'ar' ? 'تعديل بيانات الشقة' : 'Edit Apartment') 
                            : (language === 'ar' ? 'إضافة شقة جديدة' : 'Add New Apartment')}
                     </h3>
                     <button onClick={() => setShowAddEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                         <X size={20} />
                     </button>
                 </div>
                 
                 <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'رقم الشقة' : 'Apartment No.'}</label>
                             <input required type="text" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المبنى' : 'Building'}</label>
                             <input required type="text" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الطابق' : 'Floor'}</label>
                             <input type="number" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.floor} onChange={e => setFormData({...formData, floor: parseInt(e.target.value)})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المساحة (م²)' : 'Size (m²)'}</label>
                             <input type="number" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.size} onChange={e => setFormData({...formData, size: parseInt(e.target.value)})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الغرف' : 'Rooms'}</label>
                             <input type="number" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.rooms} onChange={e => setFormData({...formData, rooms: parseInt(e.target.value)})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الإيجار (EGP)' : 'Rent Amount (EGP)'}</label>
                             <input type="number" className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.rentAmount} onChange={e => setFormData({...formData, rentAmount: parseInt(e.target.value)})} />
                         </div>
                         <div className="col-span-1">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                             <select className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                    <option value="vacant">{language === 'ar' ? 'شاغر' : 'Vacant'}</option>
                                    <option value="occupied">{language === 'ar' ? 'مشغول' : 'Occupied'}</option>
                                    <option value="reserved">{language === 'ar' ? 'محجوز' : 'Reserved'}</option>
                                    <option value="archived">{language === 'ar' ? 'مؤرشف' : 'Archived'}</option>
                             </select>
                         </div>
                         <div className="col-span-1">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'تعيين مستأجر' : 'Assign Tenant'}</label>
                             <select 
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.tenantId || ''} 
                                onChange={e => setFormData({...formData, tenantId: e.target.value})}
                            >
                                    <option value="">{language === 'ar' ? '-- بدون مستأجر --' : '-- No Tenant --'}</option>
                                    {availableTenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                             </select>
                         </div>
                     </div>
                     <div className="pt-4 flex justify-end gap-3">
                         <button type="button" onClick={() => setShowAddEditModal(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                         <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                             <Save size={18} /> {isEditing ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'حفظ' : 'Save')}
                         </button>
                     </div>
                 </form>
             </div>
        </div>
      )}

      {/* Apartment Details Modal */}
      {selectedApartment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* ... existing details ... */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Home size={24} className="text-white" />
                             </div>
                             <h2 className="text-2xl font-bold">{language === 'ar' ? `الشقة ${selectedApartment.number}` : `Apartment ${selectedApartment.number}`}</h2>
                        </div>
                        <p className="text-blue-100 flex items-center gap-2">
                            <MapPin size={14} /> {selectedApartment.building}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <button onClick={() => setSelectedApartment(null)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
                            <X size={24} />
                         </button>
                         <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                            selectedApartment.status === 'occupied' ? 'bg-green-500 text-white' : 
                            selectedApartment.status === 'vacant' ? 'bg-red-500 text-white' : 
                            selectedApartment.status === 'archived' ? 'bg-gray-500 text-white' :
                            'bg-yellow-500 text-white'
                         }`}>
                            {getStatusLabel(selectedApartment.status)}
                         </span>
                    </div>
                </div>
                {/* ... rest of modal body ... */}
                <div className="p-6 overflow-y-auto space-y-6 bg-gray-50 dark:bg-gray-900/50">
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <div className="flex justify-center mb-2 text-blue-500"><Layers size={20} /></div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{language === 'ar' ? 'الطابق' : 'Floor'}</p>
                            <p className="font-bold text-gray-800 dark:text-white text-lg">{selectedApartment.floor}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <div className="flex justify-center mb-2 text-purple-500"><Maximize size={20} /></div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{language === 'ar' ? 'المساحة' : 'Size'}</p>
                            <p className="font-bold text-gray-800 dark:text-white text-lg">{selectedApartment.size} m²</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <div className="flex justify-center mb-2 text-orange-500"><BedDouble size={20} /></div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{language === 'ar' ? 'الغرف' : 'Rooms'}</p>
                            <p className="font-bold text-gray-800 dark:text-white text-lg">{selectedApartment.rooms}</p>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                            <div className="flex justify-center mb-2 text-green-500"><Info size={20} /></div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{language === 'ar' ? 'الإيجار' : 'Rent'}</p>
                            <p className="font-bold text-green-600 text-lg">{selectedApartment.rentAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Current Tenant */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex items-center gap-2">
                             <User size={18} className="text-primary" />
                             <h4 className="font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'المستأجر الحالي' : 'Current Tenant'}</h4>
                        </div>
                        <div className="p-4">
                            {selectedApartment.tenantId && getCurrentTenant(selectedApartment.tenantId) ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary dark:text-blue-400 font-bold text-xl">
                                        {getCurrentTenant(selectedApartment.tenantId)?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-800 dark:text-white text-lg">{getCurrentTenant(selectedApartment.tenantId)?.name}</h5>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{getCurrentTenant(selectedApartment.tenantId)?.phone}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{getCurrentTenant(selectedApartment.tenantId)?.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
                                    <Info size={16} /> {language === 'ar' ? 'لا يوجد مستأجر معين حالياً.' : 'No tenant currently assigned.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Maintenance History */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex items-center gap-2">
                             <History size={18} className="text-orange-500" />
                             <h4 className="font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'سجل الصيانة' : 'Maintenance History'}</h4>
                        </div>
                        <div className="divide-y dark:divide-gray-700">
                             {getApartmentMaintenance(selectedApartment.id).length > 0 ? (
                                 getApartmentMaintenance(selectedApartment.id).map(req => (
                                     <div key={req.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center">
                                         <div>
                                             <p className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                                                 <Wrench size={14} className="text-gray-400" />
                                                 {req.issueType}
                                             </p>
                                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{req.dateReported} • {req.status}</p>
                                         </div>
                                         <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                             req.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                             'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                         }`}>
                                             {req.status}
                                         </span>
                                     </div>
                                 ))
                             ) : (
                                 <p className="p-6 text-center text-gray-500 dark:text-gray-400 italic">{language === 'ar' ? 'لا توجد سجلات صيانة.' : 'No maintenance records found.'}</p>
                             )}
                        </div>
                    </div>

                </div>
                
                <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end">
                    <button 
                        onClick={() => setSelectedApartment(null)}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium"
                    >
                        {language === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Apartments;
