export type UserRole = 'admin' | 'employee';

export interface Permission {
  module: string;
  can_access: boolean;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  role: UserRole;
  two_factor_enabled: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
  permissions: Permission[];
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  requiresTwoFactor?: boolean;
  tempToken?: string;
  accessToken?: string;
  user?: User;
}

export interface Attachment {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  uploaded_at: string;
}

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  entity_type: string;
  entity_id?: string;
  description: string;
  ip_address?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  body?: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  expires_at?: string;
  created_by: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  color_hex: string;
  created_at: string;
}

export interface Product {
  id: string;
  product_name: string;
  model_no: string;
  serial_no?: string;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  category?: ProductCategory;
  description?: string;
  unit_price: number;
  stock_quantity: number;
  stock_threshold: number;
  tags: string[];
  image?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  email_unsubscribed: boolean;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Overdue' | 'Cancelled';

export interface InvoiceItem {
  id: string;
  product_id?: string;
  product_name_snapshot: string;
  model_no_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  discount_type: 'flat' | 'percent';
  discount: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  client?: Client;
  items: InvoiceItem[];
  subtotal: number;
  discount_amount: number;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  amount_paid?: number;
  status: InvoiceStatus;
  due_date?: string;
  notes?: string;
  email_sent: boolean;
  created_by: string;
  creator?: Pick<User, 'id' | 'full_name' | 'email'>;
  created_at: string;
  updated_at: string;
}

export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterConfig {
  [key: string]: string | string[] | number | boolean | null;
}

// ── Payments ─────────────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference?: string;
  notes?: string;
  recorded_by: string;
  created_at: string;
}

// ── Quotations ────────────────────────────────────────────────────────────────
export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted';

export interface QuotationItem {
  id?: string;
  product_id?: string;
  product_name: string;
  model_no?: string;
  quantity: number;
  unit_price: number;
  discount_type: 'flat' | 'percent';
  discount: number;
  line_total: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  items: QuotationItem[];
  subtotal: number;
  discount_amount: number;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  status: QuotationStatus;
  valid_until?: string;
  notes?: string;
  converted_invoice_id?: string;
  created_at: string;
  updated_at: string;
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export interface ExpenseCategory {
  id: string;
  name: string;
  color_hex: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  title: string;
  amount: number;
  expense_date: string;
  vendor?: string;
  receipt_url?: string;
  notes?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

// ── Suppliers ─────────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Purchase Orders ───────────────────────────────────────────────────────────
export type POStatus = 'Draft' | 'Ordered' | 'Received' | 'Cancelled';

export interface POItem {
  id?: string;
  product_id: string;
  product_name?: string;
  model_no?: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_cost: number;
  line_total?: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  items: POItem[];
  total_amount: number;
  status: POStatus;
  expected_date?: string;
  received_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Stock Adjustments ─────────────────────────────────────────────────────────
export type AdjustmentType = 'restock' | 'removal' | 'damage' | 'theft' | 'return_in' | 'return_out' | 'correction';

export interface StockAdjustment {
  id: string;
  product_id: string;
  product_name?: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  reference_id?: string;
  reference_type?: string;
  recorded_by: string;
  created_at: string;
}
