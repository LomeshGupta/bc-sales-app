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
  getCustomers,
  getAllCustomers,
  getCustomerById,
} from "@/services/api/customerService";
import { getItems } from "@/services/api/itemService";
import { getLocations } from "@/services/api/locationService";
import { getReports, generateReport } from "@/services/api/reportService";
import { CreateSalesOrderPayload, PaginationParams } from "@/types";
import { useAppStore } from "@/store/appStore";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  DASHBOARD_KPIS: ["dashboard", "kpis"],
  SALES_SUMMARY: ["dashboard", "salesSummary"],
  RECENT_ACTIVITY: ["dashboard", "recentActivity"],
  SALES_ORDERS: (p: PaginationParams) => ["salesOrders", p],
  SALES_ORDER: (id: string) => ["salesOrder", id],
  SALES_ORDER_LINES: (id: string) => ["sales-order-lines", id],
  CUSTOMERS: (p: PaginationParams) => ["customers", p],
  ALL_CUSTOMERS: ["customers", "all"],
  CUSTOMER: (id: string) => ["customer", id],
  ITEMS: (search?: string) => ["items", search || ""],
  LOCATIONS: (search?: string) => ["locations", search || ""],
  REPORTS: ["reports"],
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
    refetchInterval: 5 * 60_000,
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
export function useLocations(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATIONS(search),
    queryFn: () => getLocations(search),
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
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
