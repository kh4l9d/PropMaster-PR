
import { Apartment, MaintenanceRequest, Tenant, Transaction, Contract, Vendor, ContractTemplate } from './types';

export const MOCK_TENANTS: Tenant[] = [
  { id: 't1', name: 'Ahmed Ali', phone: '01012345678', email: 'ahmed@example.com', nationalId: '29001011234567', status: 'active', apartmentId: 'a1', balance: 0, leaseStart: '2023-01-01', leaseEnd: '2024-01-01' },
  { id: 't2', name: 'Sara Mohamed', phone: '01123456789', email: 'sara@example.com', nationalId: '29202021234567', status: 'active', apartmentId: 'a2', balance: 5000, leaseStart: '2023-06-01', leaseEnd: '2024-06-01' },
  { id: 't3', name: 'John Doe', phone: '01234567890', email: 'john@example.com', nationalId: 'PASS12345', status: 'inactive', apartmentId: undefined, balance: 0, leaseStart: '2022-01-01', leaseEnd: '2023-01-01' },
];

export const MOCK_APARTMENTS: Apartment[] = [
  { id: 'a1', number: '101', building: 'Building A', floor: 1, size: 120, rooms: 3, rentAmount: 15000, status: 'occupied', tenantId: 't1' },
  { id: 'a2', number: '102', building: 'Building A', floor: 1, size: 100, rooms: 2, rentAmount: 12000, status: 'occupied', tenantId: 't2' },
  { id: 'a3', number: '201', building: 'Building B', floor: 2, size: 150, rooms: 3, rentAmount: 18000, status: 'vacant' },
  { id: 'a4', number: '202', building: 'Building B', floor: 2, size: 90, rooms: 2, rentAmount: 10000, status: 'reserved' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', type: 'invoice', date: '2023-10-01', amount: 15000, description: 'Rent Oct 2023', status: 'paid', relatedId: 't1' },
  { id: 'tx2', type: 'payment', date: '2023-10-05', amount: 15000, description: 'Rent Payment Oct', status: 'completed', relatedId: 't1', paymentMethod: 'bank' },
  { id: 'tx3', type: 'invoice', date: '2023-10-01', amount: 12000, description: 'Rent Oct 2023', status: 'overdue', relatedId: 't2' },
  { id: 'tx4', type: 'expense', date: '2023-10-10', amount: 500, description: 'Plumbing Repair Apt 101', status: 'paid', category: 'repairs' },
  { id: 'tx5', type: 'transfer', date: '2023-09-30', amount: 50000, description: 'Owner Withdrawal', status: 'completed' },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: 'v1', name: 'QuickFix Plumbing', specialty: 'Plumbing', phone: '0123456789', rating: 4.5 },
  { id: 'v2', name: 'BrightSpark Electric', specialty: 'Electrical', phone: '0198765432', rating: 4.8 },
  { id: 'v3', name: 'CleanSweep Services', specialty: 'Cleaning', phone: '0112233445', rating: 4.2 },
];

export const MOCK_MAINTENANCE: MaintenanceRequest[] = [
  { 
    id: 'm1', 
    tenantId: 't1', 
    apartmentId: 'a1', 
    issueType: 'Plumbing', 
    description: 'Leaking faucet in kitchen', 
    dateReported: '2023-10-12', 
    status: 'in-progress', 
    estimatedCost: 300, 
    assignedVendor: 'QuickFix Plumbing',
    dueDate: '2023-10-20',
    attachments: [
        { id: 'att1', name: 'leak_photo.jpg', url: '#', type: 'image' }
    ]
  },
  { 
    id: 'm2', 
    tenantId: 't2', 
    apartmentId: 'a2', 
    issueType: 'Electrical', 
    description: 'AC not cooling', 
    dateReported: '2023-10-15', 
    status: 'pending', 
    estimatedCost: 1500,
    dueDate: '2023-10-25',
    attachments: [] 
  },
];

export const MOCK_CONTRACTS: Contract[] = [
  { id: 'c1', tenantId: 't1', apartmentId: 'a1', startDate: '2023-01-01', endDate: '2024-01-01', rentAmount: 15000, depositAmount: 30000, paymentFrequency: 'monthly', status: 'active', terms: 'Standard residential lease agreement. No pets allowed. Security deposit is refundable.' },
  { id: 'c2', tenantId: 't2', apartmentId: 'a2', startDate: '2023-06-01', endDate: '2024-06-01', rentAmount: 12000, depositAmount: 24000, paymentFrequency: 'monthly', status: 'active', terms: 'Corporate lease. Utilities included up to 500 EGP/month.' },
];

export const MOCK_TEMPLATES: ContractTemplate[] = [
    { id: 'tpl1', name: 'Standard Residential', terms: '1. The Tenant agrees to pay rent on the 1st of every month.\n2. The security deposit is refundable upon lease termination.\n3. No pets allowed without prior written consent.\n4. No subletting allowed.' },
    { id: 'tpl2', name: 'Commercial Lease', terms: '1. Rent is subject to 10% annual increase.\n2. Tenant is responsible for all utility payments.\n3. Alterations to the property require Landlord approval.' },
];

export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    tenants: 'Tenants',
    apartments: 'Apartments',
    finance: 'Financials',
    maintenance: 'Maintenance',
    reports: 'Reports',
    settings: 'Settings',
    contracts: 'Contracts',
    logout: 'Logout',
    welcome: 'Welcome',
    totalInvoices: 'Total Invoices',
    paymentsReceived: 'Payments Received',
    outstandingBalances: 'Outstanding Balances',
    expenses: 'Expenses',
    askAi: 'Ask AI Insight',
    notifications: 'Notifications',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    tenants: 'المستأجرين',
    apartments: 'الشقق',
    finance: 'المالية',
    maintenance: 'الصيانة',
    reports: 'التقارير',
    settings: 'الإعدادات',
    contracts: 'العقود',
    logout: 'تسجيل الخروج',
    welcome: 'مرحبًا',
    totalInvoices: 'إجمالي الفواتير',
    paymentsReceived: 'الدفعات المستلمة',
    outstandingBalances: 'الأرصدة المستحقة',
    expenses: 'المصروفات',
    askAi: 'اسأل الذكاء الاصطناعي',
    notifications: 'الإشعارات',
  }
};
