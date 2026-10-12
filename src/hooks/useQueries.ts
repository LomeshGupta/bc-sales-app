import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardKPIs,
  getSalesSummary,
  getRecentActivity,
} from "@/services/api/dashboardService";
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  getSalesOrderLines,
} from "@/services/api/salesOrderService";
import {
  getSalesInvoices,
  getSalesInvoiceById,
  getSalesInvoiceLines,
} from "@/services/api/salesInvoiceService";
import {
  getCustomers,
  getAllCustomers,
  getCustomerById,
} from "@/services/api/customerService";
import { getItems } from "@/services/api/itemService";
import { getAllpaymentTerms } from "@/services/api/paymentTerms";
import { getLocations } from "@/services/api/locationService";
import { getReports, generateReport } from "@/services/api/reportService";
import { getInventory, InventoryParams } from "@/services/api/inventoryService";
import { CreateSalesOrderPayload, PaginationParams } from "@/types";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

// ─── Query Keys ───────────────────────────────────────────────────────────────
const userScopeKey = () => useAuthStore.getState().user?.username || "anonymous";

export const QUERY_KEYS = {
  DASHBOARD_KPIS: ["dashboard", "kpis"],
  SALES_SUMMARY: ["dashboard", "salesSummary"],
  RECENT_ACTIVITY: ["dashboard", "recentActivity"],
  SALES_ORDERS: (p: PaginationParams) => ["salesOrders", userScopeKey(), p],
  SALES_ORDER: (id: string) => ["salesOrder", userScopeKey(), id],
  SALES_ORDER_LINES: (id: string) => ["sales-order-lines", userScopeKey(), id],
  SALES_INVOICES: (p: PaginationParams) => ["salesInvoices", userScopeKey(), p],
  SALES_INVOICE: (id: string) => ["salesInvoice", userScopeKey(), id],
  SALES_INVOICE_LINES: (id: string) => ["sales-invoice-lines", userScopeKey(), id],
  CUSTOMERS: (p: PaginationParams) => ["customers", userScopeKey(), p],
  ALL_CUSTOMERS: ["customers", "all", userScopeKey()],
  CUSTOMER: (id: string) => ["customer", userScopeKey(), id],
  ITEMS: (search?: string) => ["items", userScopeKey(), search || ""],
  LOCATIONS: (search?: string) => ["locations", userScopeKey(), search || ""],
  REPORTS: ["reports"],
  INVENTORY: (params: InventoryParams) => ["inventory", userScopeKey(), params],
} as const;

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useDashboardKPIs() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_KPIS,
    queryFn: getDashboardKPIs,
    staleTime: 5 * 60_000,
  });
}
export function useSalesSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_SUMMARY,
    queryFn: getSalesSummary,
    staleTime: 10 * 60_000,
  });
}
export function useRecentActivity() {
  return useQuery({
    queryKey: QUERY_KEYS.RECENT_ACTIVITY,
    queryFn: getRecentActivity,
    staleTime: 2 * 60_000,
    refetchInterval: false,
  });
}

// ─── Sales Orders ─────────────────────────────────────────────────────────────
export function useSalesOrders(params: PaginationParams) {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_ORDERS(params),
    queryFn: () => getSalesOrders(params),
    staleTime: 2 * 60_000,
    placeholderData: (prev) => prev,
  });
}
export function useSalesOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_ORDER(id),
    queryFn: () => getSalesOrderById(id),
    enabled: !!id,
  });
}

export function useSalesOrderLines(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_ORDER_LINES(id),
    queryFn: () => getSalesOrderLines(id),
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  const { showSnackbar } = useAppStore();
  return useMutation({
    mutationFn: (payload: CreateSalesOrderPayload) => createSalesOrder(payload),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["salesOrders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showSnackbar(`Order ${order.orderNo} created successfully!`, "success");
    },
    onError: (err: any) => {
      showSnackbar(err.message || "Failed to create order", "error");
    },
  });
}

// ─── Sales Invoices ────────────────────────────────────────────────────────────
export function useSalesInvoices(params: PaginationParams) {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_INVOICES(params),
    queryFn: () => getSalesInvoices(params),
    staleTime: 2 * 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useSalesInvoice(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_INVOICE(id),
    queryFn: () => getSalesInvoiceById(id),
    enabled: !!id,
  });
}

export function useSalesInvoiceLines(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_INVOICE_LINES(id),
    queryFn: () => getSalesInvoiceLines(id),
    enabled: !!id,
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────
export function useCustomers(params: PaginationParams) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMERS(params),
    queryFn: () => getCustomers(params),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
}
export function useAllCustomers() {
  return useQuery({
    queryKey: QUERY_KEYS.ALL_CUSTOMERS,
    queryFn: getAllCustomers,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}
export function useCustomer(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER(id),
    queryFn: () => getCustomerById(id),
    enabled: !!id,
  });
}

// ─── Items ────────────────────────────────────────────────────────────────────
export function useItems(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ITEMS(search),
    queryFn: () => getItems(search),
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export const usePaymentTerms = () => {
  return useQuery({
    queryKey: ["paymentTerms", userScopeKey()],
    queryFn: getAllpaymentTerms,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export function useLocations(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATIONS(search),
    queryFn: () => getLocations(search),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function useReports() {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS,
    queryFn: getReports,
    staleTime: 30 * 60_000,
  });
}
export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS }),
  });
}


// ─── Inventory ────────────────────────────────────────────────────────────────
export function useInventory(params: InventoryParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.INVENTORY(params),
    queryFn: () => getInventory(params),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
