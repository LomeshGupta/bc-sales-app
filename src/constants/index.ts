export const BC_API_BASE_URL =
  process.env.NEXT_PUBLIC_BC_API_BASE_URL ||
  "https://api.businesscentral.dynamics.com/v2.0";
export const BC_TENANT_ID = process.env.NEXT_PUBLIC_BC_TENANT_ID || "";
export const BC_COMPANY_ID = process.env.NEXT_PUBLIC_BC_COMPANY_ID || "";
export const BC_CLIENT_ID = process.env.NEXT_PUBLIC_BC_CLIENT_ID || "";
export const BC_CLIENT_SECRET = process.env.NEXT_PUBLIC_BC_CLIENT_SECRET || "";
export const BC_SCOPE =
  process.env.NEXT_PUBLIC_BC_SCOPE ||
  "https://api.businesscentral.dynamics.com/.default";
export const BC_ENV_NAME = process.env.NEXT_ENV_NAME || "Sandbox_151225";
export const SESSION_DURATION_MS = 30 * 60 * 1000;
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "bc_access_token",
  TOKEN_EXPIRY: "bc_token_expiry",
  USER: "bc_user",
  THEME: "bc_theme",
  LAST_ACTIVITY: "bc_last_activity",
} as const;

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  SALES_ORDERS: "/sales-orders",
  NEW_ORDER: "/sales-orders/new",
  CUSTOMERS: "/customers",
  REPORTS: "/reports",
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const APP_NAME = "BC Sales";
export const APP_FULL_NAME = "Business Central Sales";
export const APP_VERSION = "1.1.0";

export const ORDER_STATUS_COLORS = {
  Open: "#2196F3",
  Released: "#4CAF50",
  "Pending Approval": "#FF9800",
  "Pending Prepayment": "#FF5722",
  Shipped: "#9C27B0",
  Invoiced: "#009688",
} as const;
