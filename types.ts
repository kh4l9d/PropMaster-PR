
export type Role = 'admin' | 'manager' | 'tenant';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  apartmentId?: string; // For tenants
  avatar?: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string;
  status: 'active' | 'inactive' | 'archived';
  apartmentId?: string;
  balance: number;
  leaseStart: string;
  leaseEnd: string;
}

export interface Apartment {
  id: string;
  number: string;
  building: string;
  floor: number;
  size: number; // in m2
  rooms: number;
  rentAmount: number;
  status: 'occupied' | 'vacant' | 'reserved' | 'archived';
  tenantId?: string;
}

export type TransactionType = 'invoice' | 'payment' | 'expense' | 'transfer';
export type TransactionStatus = 'paid' | 'unpaid' | 'overdue' | 'pending' | 'completed' | 'rejected' | 'archived';

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  description: string;
  status: TransactionStatus;
  relatedId?: string; // tenantId or apartmentId or vendorId
  category?: string; // For expenses
  paymentMethod?: 'cash' | 'bank' | 'card';
  receiptUrl?: string; // For payment proofs
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  apartmentId: string;
  issueType: string;
  description: string;
  dateReported: string;
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  estimatedCost: number;
  assignedVendor?: string;
  dueDate?: string;
  attachments?: Attachment[];
}

export interface Vendor {
    id: string;
    name: string;
    specialty: string;
    phone: string;
    rating: number;
    email?: string;
    address?: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  apartmentId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'expired' | 'terminated' | 'archived';
  terms?: string;
  terminationReason?: string;
  reminderDays?: number;
  reminderChannel?: 'email' | 'system';
}

export interface ContractTemplate {
  id: string;
  name: string;
  terms: string;
}

export interface OwnerSettings {
  name: string;
  location: string;
  phone: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  details: string;
  date: string;
}

export interface Report {
  id: string;
  name: string;
  date: string;
  size: string;
  archived: boolean;
}

export interface DeletedRecord {
  id: string;
  type: 'Tenant' | 'Apartment' | 'Contract' | 'Transaction' | 'Maintenance' | 'Report' | 'Setting' | 'Role';
  name: string;
  action: 'Deleted' | 'Archived';
  originalData: any;
  date: string;
  user: string;
}

export interface AppState {
  user: User | null;
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  ownerSettings: OwnerSettings;
  auditLog: AuditLogEntry[];
}
