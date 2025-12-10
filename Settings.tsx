
import React, { useState } from 'react';
import { Globe, Shield, Bell, Save, Moon, Sun, User, MapPin, Phone, RefreshCcw, FileCheck, ClipboardList, Trash2, Plus, Users, Archive, X, Edit, RotateCcw, Database } from 'lucide-react';
import { OwnerSettings, AuditLogEntry, DeletedRecord } from '../types';

interface SettingsProps {
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  ownerSettings: OwnerSettings;
  onUpdateOwnerSettings: (settings: OwnerSettings) => void;
  auditLog?: AuditLogEntry[];
  deletedRecords: DeletedRecord[];
  archivedRecords: DeletedRecord[];
  onRestoreDeleted: (record: DeletedRecord) => void;
  onRestoreArchived: (record: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    language, onLanguageChange, theme = 'light', onThemeChange, 
    ownerSettings, onUpdateOwnerSettings, auditLog = [],
    deletedRecords, archivedRecords, onRestoreDeleted, onRestoreArchived
}) => {
  const [formData, setFormData] = useState<OwnerSettings>(ownerSettings);
  const [showAuditLog, setShowAuditLog] = useState(false);
  
  // Data Log State
  const [showDataLog, setShowDataLog] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<'deleted' | 'archived'>('deleted');

  // Roles Management State
  const [roles, setRoles] = useState([
      { id: 'r1', name: 'Administrator', users: 2, permissions: 'All Access', active: true },
      { id: 'r2', name: 'Property Manager', users: 4, permissions: 'Manage Tenants, Contracts, Maintenance', active: true },
      { id: 'r3', name: 'Financial Analyst', users: 0, permissions: 'View Reports, Manage Finance', active: true },
  ]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<{id: string, name: string, users: number, permissions: string, active: boolean} | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: '', users: 0, active: true });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveOwnerSettings = () => {
      const phoneRegex = /^\+?[0-9\s-]+$/;
      if (!phoneRegex.test(formData.phone)) {
          alert(language === 'ar' ? 'رقم الهاتف غير صالح' : 'Invalid phone number format');
          return;
      }
      if (!formData.location.trim()) {
          alert(language === 'ar' ? 'الموقع مطلوب' : 'Property Location is required');
          return;
      }
      
      onUpdateOwnerSettings(formData);
      alert(language === 'ar' ? 'تم حفظ إعدادات المالك بنجاح' : 'Owner settings saved successfully');
  };

  const handleResetDefaults = () => {
      if (window.confirm(language === 'ar' ? 'هل أنت متأكد من استعادة الإعدادات الافتراضية؟' : 'Are you sure you want to reset to defaults?')) {
          const defaults: OwnerSettings = {
              name: 'PropMaster Management',
              location: 'Cairo, Egypt',
              phone: '+20 100 000 0000'
          };
          setFormData(defaults);
          onUpdateOwnerSettings(defaults);
      }
  };

  const handleDeleteOwnerInfo = () => {
      if (window.confirm(language === 'ar' 
          ? 'تحذير: هل أنت متأكد من حذف بيانات المالك؟ هذا الإجراء قد يؤثر على العقود والفواتير الحالية.' 
          : 'WARNING: Are you sure you want to delete owner info? This may affect existing contracts and invoices.')) {
          const emptySettings: OwnerSettings = { name: '', location: '', phone: '' };
          setFormData(emptySettings);
          onUpdateOwnerSettings(emptySettings);
      }
  };

  const handleTestIntegration = () => {
      alert(language === 'ar' 
        ? `اختبار التكامل ناجح!\n\nسيظهر في العقود والفواتير:\nالمالك: ${formData.name}\nالهاتف: ${formData.phone}\nالموقع: ${formData.location}`
        : `Integration Test Successful!\n\nWill appear in contracts/invoices as:\nOwner: ${formData.name}\nPhone: ${formData.phone}\nLocation: ${formData.location}`
      );
  };

  // Role Logic
  const handleOpenRoleModal = (role: typeof editingRole = null) => {
      if (role) {
          setEditingRole(role);
          setRoleForm({ name: role.name, permissions: role.permissions, users: role.users, active: role.active });
      } else {
          setEditingRole(null);
          setRoleForm({ name: '', permissions: '', users: 0, active: true });
      }
      setShowRoleModal(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
      e.preventDefault();
      if (!roleForm.name) return;

      if (editingRole) {
          setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleForm } : r));
      } else {
          const newRole = { id: `r-${Date.now()}`, ...roleForm };
          setRoles(prev => [...prev, newRole]);
      }
      setShowRoleModal(false);
  };

  const handleDeleteRole = (id: string, userCount: number) => {
      if (userCount > 0) {
          alert(language === 'ar' 
            ? 'لا يمكن حذف الدور لأنه مرتبط بمستخدمين. يرجى إعادة تعيين المستخدمين أولاً.' 
            : 'Cannot delete role because it is assigned to users. Please reassign users first.');
          return;
      }
      if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الدور نهائياً؟' : 'Are you sure you want to permanently delete this role?')) {
          setRoles(prev => prev.filter(r => r.id !== id));
      }
  };

  const handleArchiveRole = (id: string) => {
      setRoles(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const confirmRestore = (record: DeletedRecord, isArchived: boolean) => {
      const actionName = isArchived ? (language === 'ar' ? 'استعادة من الأرشيف' : 'Unarchive') : (language === 'ar' ? 'استعادة' : 'Restore');
      if(window.confirm(language === 'ar' ? `هل أنت متأكد من ${actionName} ${record.type} "${record.name}"؟` : `Are you sure you want to ${actionName} ${record.type} "${record.name}"?`)) {
          if (isArchived) {
              onRestoreArchived(record);
          } else {
              onRestoreDeleted(record);
          }
      }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {language === 'ar' ? 'الإعدادات' : 'System Settings'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Owner Information */}
            <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex items-center gap-3 mb-6 border-b dark:border-gray-700 pb-4">
                    <User className="text-primary" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'معلومات صاحب العقار' : 'Property Owner Information'}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'تستخدم هذه البيانات في العقود والفواتير والتقارير' : 'These details are used in contracts, invoices, and reports'}</p>
                    </div>
                </div>
                {/* ... fields omitted for brevity, same as original file ... */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'اسم صاحب العقار' : 'Property Owner Name'}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full border dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 ${language === 'ar' ? 'pr-2' : 'pl-2'}`} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'موقع العقار' : 'Property Location'}</label>
                        <input type="text" name="location" value={formData.location} onChange={handleInputChange} className={`w-full border dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 ${language === 'ar' ? 'pr-2' : 'pl-2'}`} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'رقم الهاتف' : 'Owner Phone Number'}</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full border dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 ${language === 'ar' ? 'pr-2' : 'pl-2'}`} />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 justify-end border-t dark:border-gray-700 pt-4">
                     <button onClick={handleDeleteOwnerInfo} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-medium flex items-center gap-2">
                         <Trash2 size={16} /> {language === 'ar' ? 'حذف' : 'Delete'}
                     </button>
                     <button onClick={handleResetDefaults} className="px-4 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium flex items-center gap-2">
                         <RefreshCcw size={16} /> {language === 'ar' ? 'استعادة الافتراضي' : 'Reset Defaults'}
                     </button>
                     <button onClick={handleTestIntegration} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-sm font-medium flex items-center gap-2">
                         <FileCheck size={16} /> {language === 'ar' ? 'اختبار التكامل' : 'Test Integration'}
                     </button>
                     <button onClick={handleSaveOwnerSettings} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 shadow-sm">
                         <Save size={16} /> {language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                     </button>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                {/* ... same as before ... */}
                 <div className="flex items-center gap-2 mb-6 border-b dark:border-gray-700 pb-2">
                     <Globe className="text-blue-500" size={20} />
                     <h3 className="font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div><p className="font-medium text-gray-700 dark:text-gray-200">{language === 'ar' ? 'اللغة' : 'Language'}</p></div>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button onClick={() => onLanguageChange('en')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${language === 'en' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}>English</button>
                            <button onClick={() => onLanguageChange('ar')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${language === 'ar' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}>العربية</button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div><p className="font-medium text-gray-700 dark:text-gray-200">{language === 'ar' ? 'المظهر' : 'Appearance'}</p></div>
                        {onThemeChange && <button onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>}
                    </div>
                </div>
            </div>

            {/* Roles */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                 <div className="flex items-center justify-between mb-6 border-b dark:border-gray-700 pb-2">
                     <div className="flex items-center gap-2">
                        <Shield className="text-purple-500" size={20} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}</h3>
                     </div>
                     <button onClick={() => handleOpenRoleModal()} className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-1 rounded-lg flex items-center gap-1"><Plus size={12} /> {language === 'ar' ? 'دور جديد' : 'New Role'}</button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                    {roles.map(role => (
                        <div key={role.id} className={`p-3 border dark:border-gray-700 rounded-lg flex justify-between items-center group ${!role.active ? 'opacity-50 grayscale' : ''}`}>
                             <div><p className="font-bold text-sm text-gray-800 dark:text-white">{role.name}</p></div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleOpenRoleModal(role)} className="p-1 text-blue-600"><Edit size={16} /></button>
                                 <button onClick={() => handleArchiveRole(role.id)} className="p-1 text-orange-600"><Archive size={16} /></button>
                                 <button onClick={() => handleDeleteRole(role.id, role.users)} className="p-1 text-red-600"><Trash2 size={16} /></button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                        <ClipboardList className="text-orange-500" size={20} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'سجل النشاط' : 'Audit Log'}</h3>
                     </div>
                     <button onClick={() => setShowAuditLog(!showAuditLog)} className="text-sm text-blue-600 hover:underline">{showAuditLog ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'عرض السجل' : 'View Log')}</button>
                </div>
                {showAuditLog && (
                    <div className="border rounded-lg dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500"><tr><th className="p-3">{language === 'ar' ? 'المستخدم' : 'User'}</th><th className="p-3">{language === 'ar' ? 'الإجراء' : 'Action'}</th><th className="p-3">{language === 'ar' ? 'التفاصيل' : 'Details'}</th></tr></thead>
                            <tbody className="divide-y dark:divide-gray-700">{auditLog.map(log => (<tr key={log.id}><td className="p-3 text-gray-800 dark:text-gray-200">{log.user}</td><td className="p-3">{log.action}</td><td className="p-3 text-gray-500 text-xs">{log.details}</td></tr>))}</tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Deleted & Archived Records Log Section */}
            <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-2">
                        <Database className="text-red-500" size={24} />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'سجل المحذوفات والأرشيف' : 'Deleted & Archived Records Log'}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'إدارة واستعادة العناصر المحذوفة والمؤرشفة' : 'Manage and restore deleted or archived items'}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setShowDataLog(true)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
                     >
                         <ClipboardList size={16} /> {language === 'ar' ? 'فتح السجلات' : 'Open Logs'}
                     </button>
                </div>
            </div>
        </div>

        {/* Deleted & Archived Records Log Modal */}
        {showDataLog && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden h-[80vh] flex flex-col">
                    <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-2">
                            <Database className="text-gray-600 dark:text-gray-300" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {language === 'ar' ? 'سجل البيانات' : 'Data Log'}
                            </h3>
                        </div>
                        <button onClick={() => setShowDataLog(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex border-b dark:border-gray-700">
                        <button 
                            onClick={() => setActiveLogTab('deleted')}
                            className={`flex-1 py-3 font-medium text-sm transition-colors border-b-2 ${
                                activeLogTab === 'deleted' ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {language === 'ar' ? 'العناصر المحذوفة' : 'Deleted Items'} ({deletedRecords.length})
                        </button>
                        <button 
                            onClick={() => setActiveLogTab('archived')}
                            className={`flex-1 py-3 font-medium text-sm transition-colors border-b-2 ${
                                activeLogTab === 'archived' ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {language === 'ar' ? 'العناصر المؤرشفة' : 'Archived Items'} ({archivedRecords.length})
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-4 bg-gray-50/50 dark:bg-gray-900/20">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                                <tr>
                                    <th className="p-3 font-semibold rounded-tl-lg">{language === 'ar' ? 'النوع' : 'Item Type'}</th>
                                    <th className="p-3 font-semibold">{language === 'ar' ? 'الاسم / المعرف' : 'Item ID / Name'}</th>
                                    <th className="p-3 font-semibold text-center">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                                    <th className="p-3 font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                                    <th className="p-3 font-semibold">{language === 'ar' ? 'بواسطة' : 'Admin User'}</th>
                                    <th className="p-3 font-semibold rounded-tr-lg text-center">{language === 'ar' ? 'استعادة' : 'Restore'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700 bg-white dark:bg-gray-800">
                                {(activeLogTab === 'deleted' ? deletedRecords : archivedRecords).map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium text-gray-800 dark:text-white">{record.name}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeLogTab === 'deleted' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {activeLogTab === 'deleted' ? 'Deleted' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{record.date}</td>
                                        <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{record.user}</td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => confirmRestore(record, activeLogTab === 'archived')}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded flex items-center justify-center gap-1 mx-auto transition-colors text-xs font-bold border border-blue-200 dark:border-blue-900"
                                            >
                                                <RotateCcw size={14} /> {language === 'ar' ? 'استعادة' : 'Restore'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(activeLogTab === 'deleted' ? deletedRecords : archivedRecords).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400 italic">
                                            {language === 'ar' ? 'لا توجد سجلات.' : 'No records found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* Role Modal */}
        {showRoleModal && (
            // ... (modal same as before)
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {editingRole 
                                ? (language === 'ar' ? 'تعديل الدور' : 'Edit Role') 
                                : (language === 'ar' ? 'إضافة دور جديد' : 'Add New Role')}
                        </h3>
                        <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSaveRole} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'اسم الدور' : 'Role Name'}</label>
                            <input 
                                type="text" 
                                required
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={roleForm.name}
                                onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                                placeholder={language === 'ar' ? 'مثال: مشرف صيانة' : 'e.g. Maintenance Supervisor'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</label>
                            <textarea 
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={roleForm.permissions}
                                onChange={(e) => setRoleForm({...roleForm, permissions: e.target.value})}
                                placeholder={language === 'ar' ? 'مثال: إدارة المستأجرين، عرض التقارير...' : 'e.g. Manage Tenants, View Reports...'}
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المستخدمين المعينين (عدد)' : 'Assigned Users (Count)'}</label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full border dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                                value={roleForm.users}
                                onChange={(e) => setRoleForm({...roleForm, users: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <Save size={18} /> {editingRole ? (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : (language === 'ar' ? 'إنشاء الدور' : 'Create Role')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Settings;
