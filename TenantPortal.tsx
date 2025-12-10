
import React, { useState, useRef } from 'react';
import { User, Transaction, MaintenanceRequest, OwnerSettings } from '../types';
import { CreditCard, Wrench, FileText, Clock, Moon, Sun, Home, LogOut, MessageSquare, User as UserIcon, Plus, X, CheckCircle, ChevronRight, AlertCircle, Phone, Upload, ArrowLeft, Smartphone, Download, HelpCircle, Image, Paperclip, MapPin } from 'lucide-react';

interface TenantPortalProps {
  user: User;
  transactions: Transaction[];
  maintenance: MaintenanceRequest[];
  onUpdateTransaction: (t: Transaction) => void;
  onAddMaintenance: (m: MaintenanceRequest) => void;
  onLogout: () => void;
  language: 'en' | 'ar';
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  ownerSettings?: OwnerSettings;
}

const TenantPortal: React.FC<TenantPortalProps> = ({ 
    user, transactions, maintenance, 
    onUpdateTransaction, onAddMaintenance, 
    onLogout, language, theme = 'light', onThemeToggle,
    ownerSettings
}) => {
  // Mock Data
  const [activeView, setActiveView] = useState<'home' | 'profile' | 'support'>('home');
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  // Support State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportFile, setSupportFile] = useState<File | null>(null);

  // Payment Flow State
  const [paymentStep, setPaymentStep] = useState<1 | 2>(1);
  const [paymentMethod, setPaymentMethod] = useState<'InstaPay' | 'Vodafone Cash' | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // New Request Photo State
  const [requestPhoto, setRequestPhoto] = useState<File | null>(null);

  // Filter Transactions for this user
  const invoices = transactions.filter(t => t.relatedId === user.id && t.type === 'invoice').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter Maintenance Requests for this user (from global state)
  const requests = maintenance.filter(m => m.tenantId === user.id).sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());

  const balance = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0);

  // Handlers
  const resetPaymentModal = () => {
    setPaymentStep(1);
    setPaymentMethod(null);
    setReceiptFile(null);
  };

  const handlePayNow = () => {
    resetPaymentModal();
    setShowPaymentModal(true);
    setSelectedInvoice(null); // General payment
  };

  const handlePayInvoice = (inv: Transaction) => {
    resetPaymentModal();
    setSelectedInvoice(inv);
    setShowPaymentModal(true);
  };

  const handleMethodSelect = (method: 'InstaPay' | 'Vodafone Cash') => {
    setPaymentMethod(method);
    setPaymentStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleRequestPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setRequestPhoto(e.target.files[0]);
      }
  };

  const handleSupportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSupportFile(e.target.files[0]);
    }
  };

  const handleSubmitPayment = () => {
    if (!receiptFile) {
        alert(language === 'ar' ? 'يرجى رفع إيصال الدفع أولاً.' : 'Please upload the payment receipt first.');
        return;
    }

    const successMsg = language === 'ar' 
        ? 'تم استلام الإيصال. ستتم مراجعة دفعتك خلال 24 ساعة.' 
        : 'Receipt received. Your payment will be reviewed within 24 hours.';
    
    alert(successMsg);

    const receiptUrl = URL.createObjectURL(receiptFile);

    if (selectedInvoice) {
        onUpdateTransaction({
            ...selectedInvoice,
            status: 'pending', // Pending Review
            receiptUrl: receiptUrl
        });
    } else {
        const unpaid = invoices.find(i => i.status === 'unpaid' || i.status === 'overdue');
        if (unpaid) {
            onUpdateTransaction({
                ...unpaid,
                status: 'pending',
                receiptUrl: receiptUrl
            });
        }
    }
    
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newReq: MaintenanceRequest = {
        id: `req-${Date.now()}`,
        issueType: formData.get('issueType') as string,
        description: formData.get('description') as string,
        status: 'pending', // Initial status
        dateReported: new Date().toISOString().split('T')[0],
        tenantId: user.id,
        apartmentId: user.apartmentId || '',
        estimatedCost: 0,
        attachments: requestPhoto ? [{
            id: `att-${Date.now()}`,
            name: requestPhoto.name,
            url: URL.createObjectURL(requestPhoto),
            type: 'image'
        }] : []
    };

    onAddMaintenance(newReq);
    setShowNewRequestModal(false);
    setRequestPhoto(null);
    alert(language === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Request submitted successfully');
  };

  const handleDownloadReceipt = (inv: Transaction) => {
      alert(language === 'ar' ? 'جاري تحميل الإيصال...' : 'Downloading receipt...');
  };

  const handleContactSupport = (subject: string = '') => {
      setSelectedInvoice(null);
      setSelectedRequest(null); 
      setSupportSubject(subject);
      setSupportFile(null);
      setActiveView('support');
  };

  const handleSendSupportMessage = (e: React.FormEvent) => {
      e.preventDefault();
      alert(language === 'ar' ? 'تم إرسال رسالتك إلى فريق الدعم. سيتم الرد عليك قريباً.' : 'Message sent to support team. We will reply shortly.');
      setSupportSubject('');
      setSupportFile(null);
      setActiveView('home');
  };

  const handleWhatsAppSupport = () => {
      const msg = language === 'ar' 
        ? `مرحباً، لدي استفسار بخصوص شقتي رقم ${user.apartmentId}` 
        : `Hello, I have an inquiry regarding my apartment #${user.apartmentId}`;
      window.open(`https://wa.me/201000000000?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'paid': case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'unpaid': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'pending': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'in-progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
      if (language === 'ar') {
          switch(status) {
              case 'paid': return 'مدفوع';
              case 'unpaid': return 'غير مدفوع';
              case 'pending': return 'قيد المراجعة';
              case 'in-progress': return 'قيد التنفيذ';
              case 'completed': return 'مكتمل';
              case 'overdue': return 'متأخر';
              case 'rejected': return 'مرفوض';
              default: return status;
          }
      } else {
          switch(status) {
              case 'pending': return 'Under Review';
              case 'rejected': return 'Payment Rejected';
              case 'in-progress': return 'In Progress';
              default: return status;
          }
      }
  };

  const isRtl = language === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 pb-20 ${isRtl ? 'font-cairo' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
       
       <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-20 border-b dark:border-gray-700">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h1 className="font-bold text-gray-800 dark:text-white leading-tight">{language === 'ar' ? 'مرحباً،' : 'Welcome,'} {user.name}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'شقة' : 'Apt'} {user.apartmentId}</p>
                </div>
              </div>
              {onThemeToggle && (
                <button onClick={onThemeToggle} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              )}
          </div>
       </header>

       <main className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
          {/* Home View */}
          {activeView === 'home' && (
            <>
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-blue-100 dark:text-blue-200 mb-1 font-medium">{language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</p>
                            <h2 className="text-4xl font-bold">{balance.toLocaleString()} <span className="text-xl font-normal">EGP</span></h2>
                            {balance > 0 ? (
                                <p className="text-sm text-blue-200 mt-2 flex items-center gap-1">
                                    <AlertCircle size={14} /> {language === 'ar' ? 'يرجى الدفع لتجنب الغرامات' : 'Please pay to avoid late fees'}
                                </p>
                            ) : (
                                <p className="text-sm text-green-300 mt-2 flex items-center gap-1">
                                    <CheckCircle size={14} /> {language === 'ar' ? 'جميع الفواتير مدفوعة' : 'All caught up!'}
                                </p>
                            )}
                        </div>
                        {balance > 0 && (
                            <button 
                                onClick={handlePayNow}
                                className="w-full md:w-auto bg-white text-blue-700 px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CreditCard size={20} />
                                {language === 'ar' ? 'ادفع الآن' : 'Pay Now'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setShowNewRequestModal(true)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary/50 dark:hover:border-primary/50 transition-all group"
                    >
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{language === 'ar' ? 'طلب جديد' : 'New Request'}</span>
                    </button>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center gap-2">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-full text-orange-600">
                            <Clock size={24} />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                             {language === 'ar' ? 'طلبات نشطة' : 'Active Requests'}: {requests.filter(r => r.status !== 'completed').length}
                        </span>
                    </div>
                </div>

                {/* Recent Invoices */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{language === 'ar' ? 'الفواتير الأخيرة' : 'Recent Invoices'}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {invoices.length > 0 ? invoices.map((inv, idx) => (
                            <div 
                                key={inv.id} 
                                onClick={() => setSelectedInvoice(inv)}
                                className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${idx !== invoices.length - 1 ? 'border-b dark:border-gray-700' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${inv.status === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : inv.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{inv.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{inv.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800 dark:text-white">{inv.amount} <span className="text-xs font-normal text-gray-500">EGP</span></p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${getStatusColor(inv.status)}`}>
                                        {getStatusText(inv.status)}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                {language === 'ar' ? 'لا توجد فواتير' : 'No invoices found'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Maintenance Requests */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{language === 'ar' ? 'الصيانة' : 'Maintenance'}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {requests.length > 0 ? requests.map((req, idx) => (
                            <div 
                                key={req.id} 
                                onClick={() => setSelectedRequest(req)}
                                className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${idx !== requests.length - 1 ? 'border-b dark:border-gray-700' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">
                                        <Wrench size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{req.issueType}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{req.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(req.status)}`}>
                                        {getStatusText(req.status)}
                                    </span>
                                    <ChevronRight size={16} className={`text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                {language === 'ar' ? 'لا توجد طلبات صيانة' : 'No maintenance requests'}
                            </div>
                        )}
                    </div>
                </div>
            </>
          )}

          {/* Profile View */}
          {activeView === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'الملف الشخصي' : 'Personal Profile'}</h2>
                  <div className="flex flex-col items-center py-6">
                      <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-3xl font-bold mb-4">
                          {user.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{user.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400">{user.email || 'email@example.com'}</p>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-800 dark:text-white flex items-center gap-3">
                              <Phone size={18} className="text-gray-400" />
                              {user.phone || '01000000000'}
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{language === 'ar' ? 'الحدة السكنية' : 'Apartment Unit'}</label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-800 dark:text-white flex items-center gap-3">
                              <Home size={18} className="text-gray-400" />
                              {user.apartmentId}
                          </div>
                      </div>
                  </div>
                  <button className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                      {language === 'ar' ? 'تعديل البيانات' : 'Edit Information'}
                  </button>
              </div>
          )}

          {/* Support View */}
          {activeView === 'support' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                  <div className="text-center py-6 border-b dark:border-gray-700">
                      <MessageSquare size={48} className="text-primary mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'الدعم والملاحظات' : 'Support & Feedback'}</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                          {language === 'ar' ? 'نحن هنا للمساعدة. أرسل لنا ملاحظاتك أو استفساراتك.' : 'We are here to help. Send us your feedback or inquiries.'}
                      </p>
                  </div>
                  
                  {/* Owner Contact Info Card */}
                  {ownerSettings && (
                      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 space-y-3">
                          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                              <UserIcon size={18} className="text-primary" />
                              {language === 'ar' ? 'بيانات التواصل مع الإدارة' : 'Property Management Contact'}
                          </h3>
                          <div className="space-y-2 text-sm">
                              {ownerSettings.name && (
                                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                      <span className="font-medium min-w-[60px]">{language === 'ar' ? 'الاسم:' : 'Name:'}</span>
                                      <span>{ownerSettings.name}</span>
                                  </div>
                              )}
                              {ownerSettings.phone && (
                                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                      <Phone size={14} className="text-gray-400" />
                                      <span className="font-medium min-w-[60px]">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                                      <a href={`tel:${ownerSettings.phone}`} className="hover:text-primary transition-colors">{ownerSettings.phone}</a>
                                  </div>
                              )}
                              {ownerSettings.location && (
                                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                      <MapPin size={14} className="text-gray-400" />
                                      <span className="font-medium min-w-[60px]">{language === 'ar' ? 'الموقع:' : 'Location:'}</span>
                                      <span>{ownerSettings.location}</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  <form className="space-y-4" onSubmit={handleSendSupportMessage}>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الموضوع' : 'Subject'}</label>
                          <input 
                            type="text" 
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-600 rounded-lg text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" 
                            placeholder={language === 'ar' ? 'عنوان الرسالة' : 'Message Subject'} 
                            value={supportSubject}
                            onChange={(e) => setSupportSubject(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الرسالة' : 'Message'}</label>
                          <textarea rows={5} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-600 rounded-lg text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20" placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}></textarea>
                      </div>
                      
                      {/* Attachment */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'إرفاق ملف/صورة' : 'Attach File/Photo'}</label>
                          <label className="cursor-pointer flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border border-dashed dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                              <Paperclip size={18} />
                              <span className="text-sm">{supportFile ? supportFile.name : (language === 'ar' ? 'اضغط لرفع ملف...' : 'Click to upload file...')}</span>
                              <input type="file" className="hidden" onChange={handleSupportFileChange} />
                          </label>
                      </div>

                      <div className="flex flex-col gap-3 pt-2">
                         <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                              {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                          </button>
                          
                          <button 
                            type="button" 
                            onClick={handleWhatsAppSupport}
                            className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          >
                              <Smartphone size={20} />
                              {language === 'ar' ? 'تحدث معنا عبر واتساب' : 'Chat via WhatsApp'}
                          </button>
                      </div>
                  </form>
              </div>
          )}

       </main>

       {/* Payment Modal */}
       {showPaymentModal && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                   <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                       <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                           {paymentStep === 1 
                                ? (language === 'ar' ? 'اختر طريقة الدفع' : 'Choose Payment Method') 
                                : (language === 'ar' ? 'رفع الإيصال' : 'Upload Receipt')}
                       </h3>
                       <button onClick={() => setShowPaymentModal(false)}><X size={20} className="text-gray-500" /></button>
                   </div>
                   
                   <div className="p-6 space-y-6">
                       <div className="text-center mb-4">
                           <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{language === 'ar' ? 'المبلغ المستحق' : 'Amount Due'}</p>
                           <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                               {selectedInvoice ? selectedInvoice.amount.toLocaleString() : balance.toLocaleString()} <span className="text-lg text-gray-500">EGP</span>
                           </h2>
                       </div>
                       {paymentStep === 1 && (
                           <div className="space-y-4">
                               <button onClick={() => handleMethodSelect('InstaPay')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-3"><Smartphone size={24} /> <span>InstaPay</span></button>
                               <button onClick={() => handleMethodSelect('Vodafone Cash')} className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-all flex items-center justify-center gap-3"><Phone size={24} /> <span>Vodafone Cash</span></button>
                           </div>
                       )}
                       {paymentStep === 2 && (
                           <div className="space-y-6">
                               <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{language === 'ar' ? `يرجى تحويل المبلغ عبر ${paymentMethod === 'InstaPay' ? 'إنستا باي' : 'فودافون كاش'} ورفع صورة الإيصال هنا.` : `Please transfer via ${paymentMethod} and upload the receipt image here.`}</p>
                                   <label className="cursor-pointer inline-flex flex-col items-center justify-center w-full h-32 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600">
                                       <Upload size={32} className="text-gray-400 mb-2" />
                                       <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{receiptFile ? receiptFile.name : (language === 'ar' ? 'اضغط لرفع الإيصال' : 'Click to upload receipt')}</span>
                                       <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                                   </label>
                               </div>
                               <div className="flex gap-3">
                                   <button onClick={() => setPaymentStep(1)} className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2"><ArrowLeft size={18} /> {language === 'ar' ? 'عودة' : 'Back'}</button>
                                   <button onClick={handleSubmitPayment} className={`flex-[2] py-3 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${receiptFile ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`} disabled={!receiptFile}><CheckCircle size={18} /> {language === 'ar' ? 'تأكيد الدفع' : 'Confirm Payment'}</button>
                               </div>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

       {/* New Request Modal */}
       {showNewRequestModal && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                   <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                       <h3 className="text-lg font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'طلب صيانة جديد' : 'New Maintenance Request'}</h3>
                       <button onClick={() => setShowNewRequestModal(false)}><X size={20} className="text-gray-500" /></button>
                   </div>
                   <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'نوع المشكلة' : 'Issue Type'}</label>
                           <select name="issueType" className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-600 rounded-lg text-gray-800 dark:text-white outline-none">
                               <option value="Plumbing">{language === 'ar' ? 'سباكة' : 'Plumbing'}</option>
                               <option value="Electrical">{language === 'ar' ? 'كهرباء' : 'Electrical'}</option>
                               <option value="Appliance">{language === 'ar' ? 'أجهزة منزلية' : 'Appliance'}</option>
                               <option value="Other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                           <textarea name="description" required rows={4} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-600 rounded-lg text-gray-800 dark:text-white outline-none" placeholder={language === 'ar' ? 'اشرح المشكلة بالتفصيل...' : 'Describe the issue in detail...'}></textarea>
                       </div>
                       <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'صورة (اختياري)' : 'Photo (Optional)'}</label>
                            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                                <label className="cursor-pointer flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                                    <Image size={20} />
                                    <span className="text-sm">{requestPhoto ? requestPhoto.name : (language === 'ar' ? 'إرفاق صورة' : 'Attach Photo')}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleRequestPhotoChange} />
                                </label>
                            </div>
                       </div>
                       <div className="pt-2">
                           <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                               {language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* Invoice Details Modal */}
       {selectedInvoice && !showPaymentModal && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                   <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                       <h3 className="text-lg font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}</h3>
                       <button onClick={() => setSelectedInvoice(null)}><X size={20} className="text-gray-500" /></button>
                   </div>
                   <div className="p-6 space-y-6">
                       <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800">
                           <div className="flex justify-between items-center border-b border-dashed border-gray-300 dark:border-gray-600 pb-3">
                               <span className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'المبلغ' : 'Amount'}</span>
                               <span className="text-2xl font-bold text-gray-800 dark:text-white">{selectedInvoice.amount.toLocaleString()} <span className="text-sm font-normal text-gray-500">EGP</span></span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'النوع' : 'Type'}</span>
                               <span className="text-gray-800 dark:text-white font-medium">{selectedInvoice.description}</span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice ID'}</span>
                               <span className="text-gray-800 dark:text-white font-mono">#{selectedInvoice.id}</span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'التاريخ' : 'Date'}</span>
                               <span className="text-gray-800 dark:text-white">{selectedInvoice.date}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-3">
                           {(selectedInvoice.status === 'unpaid' || selectedInvoice.status === 'overdue' || selectedInvoice.status === 'rejected') && (
                               <button onClick={() => handlePayInvoice(selectedInvoice)} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                   {language === 'ar' ? 'دفع الفاتورة' : 'Pay Invoice'}
                                </button>
                           )}

                           {selectedInvoice.status === 'pending' && (
                               <div className="w-full py-3 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl font-bold text-center border border-orange-200 dark:border-orange-800">
                                   {language === 'ar' ? 'جاري مراجعة الإيصال' : 'Receipt Under Review'}
                               </div>
                           )}

                           {selectedInvoice.status === 'paid' && (
                                <button 
                                    onClick={() => handleDownloadReceipt(selectedInvoice)}
                                    className="w-full py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={18} />
                                    {language === 'ar' ? 'تحميل الإيصال' : 'Download Receipt'}
                                </button>
                           )}
                           <button 
                                onClick={() => handleContactSupport(`${language === 'ar' ? 'استفسار بخصوص فاتورة' : 'Inquiry regarding Invoice'} #${selectedInvoice.id}`)}
                                className="w-full py-3 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <HelpCircle size={18} />
                                {language === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
                            </button>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Maintenance Request Details Modal */}
       {selectedRequest && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                   <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                       <h3 className="text-lg font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}</h3>
                       <button onClick={() => setSelectedRequest(null)}><X size={20} className="text-gray-500" /></button>
                   </div>
                   <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Wrench size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800 dark:text-white">{selectedRequest.issueType}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(selectedRequest.status)}`}>
                                    {getStatusText(selectedRequest.status)}
                                </span>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{selectedRequest.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">{language === 'ar' ? 'تاريخ التبليغ' : 'Date Reported'}</p>
                                <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.dateReported}</p>
                            </div>
                            {selectedRequest.assignedVendor && (
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs">{language === 'ar' ? 'المسؤول' : 'Assigned To'}</p>
                                    <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.assignedVendor}</p>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => handleContactSupport(`${language === 'ar' ? 'استفسار بخصوص صيانة' : 'Inquiry regarding Maintenance'} #${selectedRequest.id}`)}
                            className="w-full py-3 bg-white border border-gray-200 dark:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={18} /> {language === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
                        </button>
                   </div>
               </div>
           </div>
       )}

       {/* Bottom Navigation Toolbar */}
       <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t dark:border-gray-700 py-2 px-6 flex justify-between items-center z-40">
            <button 
                onClick={() => setActiveView('home')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeView === 'home' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
                <Home size={24} strokeWidth={activeView === 'home' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </button>
            <button 
                onClick={() => setActiveView('profile')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeView === 'profile' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
                <UserIcon size={24} strokeWidth={activeView === 'profile' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{language === 'ar' ? 'ملفي' : 'Profile'}</span>
            </button>
            <button 
                onClick={() => handleContactSupport()}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeView === 'support' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
                <MessageSquare size={24} strokeWidth={activeView === 'support' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{language === 'ar' ? 'الدعم' : 'Support'}</span>
            </button>
            <button 
                onClick={onLogout}
                className="flex flex-col items-center gap-1 p-2 rounded-lg text-red-500 hover:text-red-700 transition-colors"
            >
                <LogOut size={24} />
                <span className="text-[10px] font-medium">{language === 'ar' ? 'خروج' : 'Logout'}</span>
            </button>
       </div>
    </div>
  );
};

export default TenantPortal;
