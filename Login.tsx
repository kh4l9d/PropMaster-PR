
import React, { useState } from 'react';
import { User } from '../types';
import { Moon, Sun, Globe, HelpCircle, ArrowLeft, ArrowRight, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  language: 'en' | 'ar';
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  onLanguageToggle?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, language, theme = 'light', onThemeToggle, onLanguageToggle }) => {
  const [role, setRole] = useState<'manager' | 'tenant'>('manager');
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [apartmentId, setApartmentId] = useState('');

  // Register Form States (Tenant)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regApartment, setRegApartment] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'manager') {
       onLogin({
         id: 'm1',
         name: 'Admin Manager',
         email: email || 'admin@example.com',
         role: 'manager'
       });
    } else {
       // Validate Tenant Login
       onLogin({
         id: 't1',
         name: 'Tenant User',
         phone: phone,
         role: 'tenant',
         apartmentId: apartmentId || '101'
       });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    alert(language === 'ar' ? 'تم إرسال طلب التسجيل بنجاح. يرجى انتظار الموافقة.' : 'Registration request sent. Please wait for approval.');
    setView('login');
  };

  const handleForgotPass = (e: React.FormEvent) => {
    e.preventDefault();
    alert(language === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى هاتفك.' : 'Password reset link sent to your phone/email.');
    setView('login');
  };

  const handleGmailLogin = () => {
    // Mock Gmail OAuth
    if (role === 'manager') {
       onLogin({ id: 'm2', name: 'Google Manager', email: 'manager@gmail.com', role: 'manager' });
    } else {
       onLogin({ id: 't2', name: 'Google Tenant', phone: '0100000000', role: 'tenant', apartmentId: '202' });
    }
  };

  const isRtl = language === 'ar';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100 dark:border-gray-700 z-10 flex flex-col">
        {/* Top Utility Bar */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
            {onLanguageToggle && (
                <button 
                    onClick={onLanguageToggle} 
                    className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    title={language === 'ar' ? 'English' : 'العربية'}
                >
                    <Globe size={18} />
                </button>
            )}
            {onThemeToggle && (
                <button 
                    onClick={onThemeToggle} 
                    className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
            )}
        </div>

        {/* Header Section */}
        <div className={`p-8 text-center relative transition-all duration-500 ${role === 'manager' ? 'bg-primary' : 'bg-gradient-to-br from-indigo-600 to-purple-700'}`}>
          <div className="mb-4 inline-block bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
             <div className="text-3xl font-bold text-white">P</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
             {view === 'register' ? (language === 'ar' ? 'إنشاء حساب' : 'Create Account') : 
              view === 'forgot' ? (language === 'ar' ? 'استعادة الحساب' : 'Recovery') : 
              'PropMaster'}
          </h1>
          <p className="text-blue-100 text-sm">
             {view === 'register' ? (language === 'ar' ? 'انضم إلينا كمستأجر جديد' : 'Join us as a new tenant') : 
              view === 'forgot' ? (language === 'ar' ? 'استعد كلمة المرور الخاصة بك' : 'Recover your password') : 
              (language === 'ar' ? 'نظام إدارة العقارات المتكامل' : 'Property Management Simplified')}
          </p>
        </div>

        {/* Role Switcher (Only visible in login view) */}
        {view === 'login' && (
             <div className="flex border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                className={`flex-1 py-4 text-sm font-bold transition-colors relative ${role === 'manager' ? 'text-primary dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => setRole('manager')}
              >
                {language === 'ar' ? 'مدير العقار' : 'Manager'}
                {role === 'manager' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary dark:bg-blue-400"></div>}
              </button>
              <button
                className={`flex-1 py-4 text-sm font-bold transition-colors relative ${role === 'tenant' ? 'text-indigo-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => setRole('tenant')}
              >
                {language === 'ar' ? 'مستأجر' : 'Tenant'}
                {role === 'tenant' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-purple-400"></div>}
              </button>
            </div>
        )}

        {/* Content Area */}
        <div className="p-8 space-y-4">
          
          {/* LOGIN VIEW */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              {role === 'manager' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <div className="relative">
                      <Mail className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} size={18} />
                      <input 
                        type="email" 
                        className={`w-full py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                  </div>
                </div>
              ) : (
                <>
                   <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                    <input 
                      type="tel" 
                      className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white"
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'رقم الشقة' : 'Apartment Number'}</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white"
                      placeholder="e.g. 101"
                      value={apartmentId}
                      onChange={(e) => setApartmentId(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                 <label className="flex items-center cursor-pointer">
                   <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-white dark:bg-gray-900" />
                   <span className="mx-2 text-gray-600 dark:text-gray-400">{language === 'ar' ? 'تذكرني' : 'Remember me'}</span>
                 </label>
                 <button type="button" onClick={() => setView('forgot')} className="text-primary dark:text-blue-400 hover:underline font-medium">
                     {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                 </button>
              </div>

              <button 
                type="submit" 
                className={`w-full text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${role === 'manager' ? 'bg-primary hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>
              
              <button 
                   type="button" 
                   onClick={handleGmailLogin}
                   className="w-full flex items-center justify-center gap-2 border dark:border-gray-600 bg-white dark:bg-gray-700 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                   <span className="font-bold text-red-500">G</span>
                   <span className="text-gray-600 dark:text-gray-300 font-medium">{language === 'ar' ? 'دخول باستخدام جوجل' : 'Login with Gmail'}</span>
              </button>

              {role === 'tenant' && (
                  <div className="text-center pt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                          {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"} {' '}
                          <button type="button" onClick={() => setView('register')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                              {language === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                          </button>
                      </p>
                  </div>
              )}
            </form>
          )}

          {/* REGISTER VIEW */}
          {view === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
                    <input type="text" className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white" required value={regName} onChange={e => setRegName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                    <input type="tel" className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white" required value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input type="email" className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'رقم الشقة' : 'Apartment Number'}</label>
                    <input type="text" className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white" required value={regApartment} onChange={e => setRegApartment(e.target.value)} />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setView('login')} className="flex-1 py-3 rounded-xl border dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md">
                          {language === 'ar' ? 'تسجيل' : 'Register'}
                      </button>
                  </div>
              </form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
              <form onSubmit={handleForgotPass} className="space-y-6 animate-fade-in py-4">
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                      {language === 'ar' ? 'أدخل رقم هاتفك أو بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.' : 'Enter your phone number or email address and we will send you a link to reset your password.'}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{language === 'ar' ? 'الهاتف / البريد الإلكتروني' : 'Phone / Email'}</label>
                    <input type="text" className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none" required />
                  </div>
                  
                  <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 shadow-md">
                      {language === 'ar' ? 'إرسال الرابط' : 'Send Reset Link'}
                  </button>
                  
                  <button type="button" onClick={() => setView('login')} className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm font-medium">
                      {language === 'ar' ? 'عودة لتسجيل الدخول' : 'Back to Login'}
                  </button>
              </form>
          )}

        </div>

        {/* Footer Help */}
        <div className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 p-4 text-center">
             <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 flex items-center justify-center gap-1 mx-auto transition-colors">
                 <HelpCircle size={16} />
                 <span>{language === 'ar' ? 'المساعدة والدعم' : 'Help & Support'}</span>
             </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
