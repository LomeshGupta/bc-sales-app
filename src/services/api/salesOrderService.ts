import {
  SalesOrder,
  SalesOrderLine,
  PaginationParams,
  PaginatedResponse,
  CreateSalesOrderPayload,
} from "@/types";

import { DEFAULT_PAGE_SIZE } from "@/constants";

import { getOAuthToken } from "../auth/tokenService";

import { BC_TENANT_ID, BC_ENV_NAME } from "@/constants";

// ======================================================
// BC CONFIG
// ======================================================

const COMPANY_NAME = "My Company";

const BC_BASE_URL =
  `https://api.businesscentral.dynamics.com/v2.0/${BC_TENANT_ID}` +
  `/${BC_ENV_NAME}` +
  `/ODataV4/Company('${encodeURIComponent(COMPANY_NAME)}')`;

// ======================================================
// BC HELPER
// ======================================================

async function bcGet<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const token = await getOAuthToken();

  const url = new URL(`${BC_BASE_URL}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function bcPost<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getOAuthToken();

  const response = await fetch(`${BC_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function bcPatch<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getOAuthToken();

  const response = await fetch(`${BC_BASE_URL}/${endpoint}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

// ======================================================
// SALES ORDERS
// ======================================================

export async function getSalesOrders(
  params: PaginationParams,
): Promise<PaginatedResponse<SalesOrder>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = params;

  const query: Record<string, string> = {
    $top: String(pageSize),
    $skip: String((page - 1) * pageSize),
  };

  if (search) {
    query.$filter =
      `contains(No,'${search}') or ` +
      `contains(Sell_to_Customer_Name,'${search}')`;
  }

  const data = await bcGet<{
    value: any[];
  }>("SalesOrderList", query);

  const orders = data.value.map(mapBCOrder);

  return {
    data: orders,
    total: orders.length,
    page,
    pageSize,
    totalPages: Math.ceil(orders.length / pageSize),
  };
}

export async function getSalesOrderById(
  orderNo: string,
): Promise<SalesOrder | null> {
  const data = await bcGet<{
    value: any[];
  }>("SalesOrderList", {
    $filter: `No eq '${orderNo}'`,
  });

  if (!data.value.length) {
    return null;
  }

  return mapBCOrder(data.value[0]);
}

export async function getSalesOrderLines(
  orderNo: string,
): Promise<SalesOrderLine[]> {
  const data = await bcGet<{
    value: any[];
  }>("SalesOrderLines", {
    $filter: `Document_No eq '${orderNo}'`,
  });

  return data.value.map(mapBCOrderLine);
}

// ======================================================
// CREATE SALES ORDER
// ======================================================

export async function createSalesOrder(
  payload: CreateSalesOrderPayload,
): Promise<SalesOrder> {
  const bcPayload = {
    customerNo: payload.customerNo,
    orderDate: payload.orderDate,
    requestedDeliveryDate: payload.requestedDeliveryDate,
    externalDocumentNo: payload.externalDocumentNo || "",
    locationCode: payload.locationCode || "MAIN",
    salespersonCode: payload.salespersonCode || "",
    paymentTermsCode: payload.paymentTermsCode || "NET30",
    currencyCode: payload.currencyCode || "",
    yourReference: payload.yourReference || "",
    shipToName: payload.shipToName || "",
    shipToAddress: payload.shipToAddress || "",
    shipToCity: payload.shipToCity || "",
    shipToCountry: payload.shipToCountry || "",
    lines: payload.lines.map((line) => ({
      lineNo: line.lineNo,
      type: line.type || "Item",
      no: line.itemNo,
      description: line.description,
      quantity: line.quantity,
      unitOfMeasureCode: line.unitOfMeasureCode || "PCS",
      unitPrice: line.unitPrice,
      lineDiscountPercent: line.discountPercent || 0,
    })),
  };

  const result = await bcPost<any>("salesOrders", bcPayload);

  return mapBCOrder(result);
}

// ======================================================
// MAPPERS
// ======================================================

function mapBCOrder(bc: any): SalesOrder {
  return {
    id: bc.No,
    orderNo: bc.No,

    customerNo: bc.Sell_to_Customer_No,

    customerName: bc.Sell_to_Customer_Name,

    orderDate: bc.Posting_Date,

    status: bc.Status,

    amount: Number(bc.Amount || 0),

    currency: bc.Currency_Code || "INR",

    salesperson: bc.Salesperson_Code || "",

    shipmentDate: bc.Shipment_Date,

    externalDocumentNo: bc.External_Document_No,

    locationCode: bc.Location_Code,

    paymentTermsCode: bc.Payment_Terms_Code,
  };
}

function mapBCOrderLine(bc: any): SalesOrderLine {
  return {
    id: bc.Document_No + "-" + bc.Line_No,

    orderId: bc.Document_No,

    lineNo: bc.Line_No,

    itemNo: bc.No,

    description: bc.Description,

    quantity: Number(bc.Quantity || 0),

    unitPrice: Number(bc.Unit_Price || 0),

    lineAmount: Number(bc.Amount || 0),

    discountPercent: Number(bc.Line_Discount_Percent || 0),

    unitOfMeasureCode: bc.Unit_of_Measure_Code,

    type: bc.Type,
  };
}
