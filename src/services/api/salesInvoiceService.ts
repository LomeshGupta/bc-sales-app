import {
  SalesInvoice,
  SalesInvoiceLine,
  PaginationParams,
  PaginatedResponse,
} from "@/types";

import { DEFAULT_PAGE_SIZE, BC_TENANT_ID, BC_ENV_NAME } from "@/constants";
import { getOAuthToken } from "../auth/tokenService";
import { useAuthStore } from "@/store/authStore";
import { bcFetch } from "./bcRequest";

// Keep the same Business Central OData configuration/pattern used by
// salesOrderService. The endpoints themselves are the posted-invoice APIs.
const COMPANY_NAME = "My Company";

const BC_BASE_URL =
  `https://api.businesscentral.dynamics.com/v2.0/${BC_TENANT_ID}` +
  `/${BC_ENV_NAME}` +
  `/ODataV4/Company('${encodeURIComponent(COMPANY_NAME)}')`;

async function bcGet<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const token = await getOAuthToken();
  const url = new URL(`${BC_BASE_URL}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.append(key, value);
    }
  });

  const response = await bcFetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/json",
      "Data-Access-Intent": "ReadOnly",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

function getSalespersonCodes(): string[] {
  return (useAuthStore.getState().user?.SalesRep ?? "")
    .split("|")
    .map((code) => code.trim())
    .filter(Boolean);
}

function escapeOData(value: string): string {
  return value.replace(/'/g, "''");
}

function buildSalespersonFilter(): string | null {
  const codes = getSalespersonCodes();
  if (!codes.length) return null;

  return codes
    .map((code) => `salespersonCode eq '${escapeOData(code)}'`)
    .join(" or ");
}

// -----------------------------------------------------------------------------
// Sales Invoice Header - same security/pagination pattern as Sales Orders
// -----------------------------------------------------------------------------
export async function getSalesInvoices(
  params: PaginationParams,
): Promise<PaginatedResponse<SalesInvoice>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = params;

  const salespersonFilter = buildSalespersonFilter();

  // Fail closed. Never request an unscoped invoice list.
  if (!salespersonFilter) {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const filters: string[] = [`(${salespersonFilter})`];

  if (search?.trim()) {
    const escapedSearch = escapeOData(search.trim());
    filters.push(`contains(invoiceNo,'${escapedSearch}')`);
  }

  const query: Record<string, string> = {
    $top: String(pageSize),
    $skip: String((page - 1) * pageSize),
    $count: "true",
    $orderby: "createdDateTime desc",
    $filter: filters.join(" and "),
  };

  const data = await bcGet<{
    value: any[];
    "@odata.count"?: number;
  }>("velvotixinvoices", query);

  const invoices = data.value.map(mapSalesInvoice);
  const total = data["@odata.count"] ?? invoices.length;

  return {
    data: invoices,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// -----------------------------------------------------------------------------
// Single Sales Invoice - validate header ownership first
// -----------------------------------------------------------------------------
export async function getSalesInvoiceById(
  systemId: string,
): Promise<SalesInvoice | null> {
  const salespersonFilter = buildSalespersonFilter();

  if (!salespersonFilter) return null;

  const data = await bcGet<{ value: any[] }>("velvotixinvoices", {
    $top: "1",
    $filter: `id eq ${systemId} and (${salespersonFilter})`,
  });

  if (!data.value.length) return null;

  return mapSalesInvoice(data.value[0]);
}

// -----------------------------------------------------------------------------
// Sales Invoice Lines
// IMPORTANT: Sales Invoice Line does NOT have salespersonCode.
// Authorize the parent invoice first, then filter lines ONLY by documentNo.
// This is the same parent-validation pattern used by getSalesOrderLines().
// -----------------------------------------------------------------------------
export async function getSalesInvoiceLines(
  invoiceSystemId: string,
): Promise<SalesInvoiceLine[]> {
  const invoice = await getSalesInvoiceById(invoiceSystemId);

  if (!invoice) return [];
  if (!invoice.invoiceNo) return [];

  const data = await bcGet<{ value: any[] }>("velvotixinvoicelines", {
    $filter: `documentNo eq '${escapeOData(invoice.invoiceNo)}'`,
  });

  return data.value.map((line) => mapSalesInvoiceLine(line, invoiceSystemId));
}

// -----------------------------------------------------------------------------
// Mappers
// -----------------------------------------------------------------------------
export function mapSalesInvoice(bc: any): SalesInvoice {
  return {
    id: bc.id,
    invoiceNo: bc.invoiceNo || "",
    orderNo: bc.orderNo || "",
    customerNo: bc.customerNo || "",
    customerName: bc.customerName || "",
    postingDate: bc.postingDate || "",
    documentDate: bc.documentDate || "",
    dueDate: bc.dueDate || "",
    amount: Number(bc.amount || 0),
    amountIncludingVAT: Number(bc.amountIncludingVAT || 0),
    currency: bc.currencyCode || "INR",
    salesperson: bc.salespersonCode || "",
    externalDocumentNo: bc.externalDocumentNo || "",
    yourReference: bc.yourReference || "",
    locationCode: bc.locationCode || "",
    paymentTermsCode: bc.paymentTermsCode || "",
    shipToName: bc.shipToName || "",
    shipToAddress: bc.shipToAddress || "",
    shipToCity: bc.shipToCity || "",
    shipToCountry: bc.shipToCountry || "",
    invoiceDiscountAmount: Number(bc.invoiceDiscountAmount || 0),
  };
}

export function mapSalesInvoiceLine(
  bc: any,
  invoiceSystemId = "",
): SalesInvoiceLine {
  return {
    id: bc.id || `${bc.documentNo}-${bc.lineNo}`,
    invoiceId: invoiceSystemId,
    documentNo: bc.documentNo || "",
    lineNo: Number(bc.lineNo || 0),
    type: bc.type,
    itemNo: bc.itemNo || "",
    description: bc.description || "",
    description2: bc.description2 || "",
    quantity: Number(bc.quantity || 0),
    unitPrice: Number(bc.unitPrice || 0),
    lineAmount: Number(bc.lineAmount || 0),
    amountIncludingVAT: Number(bc.amountIncludingVAT || 0),
    discountPercent: Number(bc.discountPercent || 0),
    unitOfMeasureCode: bc.unitOfMeasureCode || "",
    locationCode: bc.locationCode || "",
  };
}
