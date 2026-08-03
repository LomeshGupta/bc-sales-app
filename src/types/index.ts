// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface OAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface BCUser {
  userId: string;
  username: string;
  displayName?: string;
  email?: string;
  role?: string;
  location?: string;
  SalesRep?: string;
  ItemCat?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// ─── Sales Orders ─────────────────────────────────────────────────────────────
export interface SalesOrder {
  id: string;
  orderNo: string;
  customerNo: string;
  customerName: string;
  orderDate: string;
  status:
    | "Open"
    | "Released"
    | "Pending Approval"
    | "Pending Prepayment"
    | "Shipped"
    | "Invoiced";
  amount: number;
  currency: string;
  salesperson: string;
  shipmentDate?: string;
  externalDocumentNo?: string;
  locationCode?: string;
  paymentTermsCode?: string;
}

export interface SalesOrderLine {
  id: string;
  orderId: string;
  lineNo: number;
  itemNo: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  discountPercent?: number;
  unitOfMeasureCode?: string;
  type?: string;
}

// ─── Create Sales Order (Phase 2) ────────────────────────────────────────────
export interface CreateSalesOrderLine {
  lineNo: number;
  type?: "Item" | "G/L Account" | "Resource" | "Fixed Asset" | "Charge (Item)";
  itemNo: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  unitOfMeasureCode?: string;
}

export interface CreateSalesOrderPayload {
  customerNo: string;
  orderDate: string;
  requestedDeliveryDate?: string;
  externalDocumentNo?: string;
  yourReference?: string;
  locationCode?: string;
  salespersonCode?: string;
  paymentTermsCode?: string;
  currencyCode?: string;
  shipToName?: string;
  shipToAddress?: string;
  shipToCity?: string;
  shipToCountry?: string;
  lines: CreateSalesOrderLine[];
}

// ─── Items (for order lines) ──────────────────────────────────────────────────
export interface BCItem {
  id: string;
  no: string;
  description: string;
  unitPrice: number;
  unitOfMeasureCode: string;
  inventory: number;
  itemCategoryCode?: string;
  type?: string;
}

export interface BCPaymentTerm {
  id: string;
  no: string;
  description: string;
}

export interface BCLocation {
  id: string;
  code: string;
  displayName: string;
  contact: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  website: string;
  lastModifiedDateTime: string;
}

// ─── Customers ────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  no: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  balance: number;
  creditLimit: number;
  currency: string;
  salesperson?: string;
  customerGroup?: string;
  blocked?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface KPICard {
  id: string;
  title: string;
  value: number | string;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  currency?: boolean;
  icon: string;
  color: string;
}

export interface SalesSummary {
  postingDate: number;
  postingYear: number;
  amount: number;
}

export interface RecentActivity {
  id: string;
  type: "order" | "customer" | "payment" | "shipment";
  description: string;
  time: string;
  amount?: number;
  status?: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface Report {
  id: string;
  title: string;
  description: string;
  category: "sales" | "finance" | "inventory" | "customers";
  lastGenerated?: string;
  icon: string;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────
export interface BCApiResponse<T> {
  value: T[];
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  filter?: string;
  orderBy?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export type ThemeMode = "light" | "dark";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string;
}
