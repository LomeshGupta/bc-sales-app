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
// CONFIG
// ======================================================

const COMPANY_NAME = "My Company";

const BC_BASE_URL =
  `https://api.businesscentral.dynamics.com/v2.0/${BC_TENANT_ID}` +
  `/${BC_ENV_NAME}` +
  `/ODataV4/Company('${encodeURIComponent(COMPANY_NAME)}')`;

// ======================================================
// HELPERS
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
  console.log(url);
  console.log(url.toString());
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const err = await response.text();
    console.log("BC ERROR:", err);
    throw new Error(err);
  }

  return response.json();
}

async function bcPost<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getOAuthToken();

  const response = await fetch(`${BC_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
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
// GET STAGING ORDERS
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
    query.$filter = `contains(bcOrderNo,'${search}')`;
  }

  const data = await bcGet<{
    value: any[];
  }>("StagingHeader", query);

  const orders = data.value.map(mapStagingHeader);

  return {
    data: orders,
    total: orders.length,
    page,
    pageSize,
    totalPages: Math.ceil(orders.length / pageSize),
  };
}

// ======================================================
// GET SINGLE ORDER
// ======================================================

export async function getSalesOrderById(
  systemId: string,
): Promise<SalesOrder | null> {
  const data = await bcGet<{
    value: any[];
  }>("StagingHeader", {
    $filter: `id eq ${systemId}`,
  });

  if (!data.value.length) {
    return null;
  }

  return mapStagingHeader(data.value[0]);
}

// ======================================================
// GET LINES
// ======================================================

export async function getSalesOrderLines(
  headerSystemId: string,
): Promise<SalesOrderLine[]> {
  const data = await bcGet<{
    value: any[];
  }>("StagingLine", {
    $filter: `headerSystemId eq ${headerSystemId}`,
  });
  return data.value.map(mapStagingLine);
}

// ======================================================
// CREATE ORDER
// ======================================================

export async function createSalesOrder(
  payload: CreateSalesOrderPayload,
): Promise<SalesOrder> {
  const header = await bcPost<any>("StagingHeader", {
    customerNo: payload.customerNo,

    orderDate: payload.orderDate,

    requestedDeliveryDate: payload.requestedDeliveryDate || null,

    externalDocumentNo: payload.externalDocumentNo || "",

    yourReference: payload.yourReference || "",

    locationCode: payload.locationCode || "",

    paymentTermsCode: payload.paymentTermsCode || "",

    salespersonCode: payload.salespersonCode || "",

    shipToName: payload.shipToName || "",

    shipToAddress: payload.shipToAddress || "",

    shipToCity: payload.shipToCity || "",

    shipToCountry: payload.shipToCountry || "",
  });

  for (const line of payload.lines) {
    await bcPost("StagingLine", {
      headerSystemId: header.id,

      lineNo: line.lineNo,

      itemNo: line.itemNo,

      description: line.description || "",

      quantity: line.quantity,

      unitPrice: line.unitPrice,

      discountPercent: line.discountPercent || 0,

      unitOfMeasureCode: line.unitOfMeasureCode || "PCS",
    });
  }

  return mapStagingHeader(header);
}

// ======================================================
// MAPPERS
// ======================================================

function mapStagingHeader(bc: any): SalesOrder {
  return {
    id: bc.id,

    orderNo: bc.bcOrderNo || "",

    customerNo: bc.customerNo,

    customerName: bc.shipToName || "",

    orderDate: bc.orderDate,

    status: bc.status,

    amount: 0,

    currency: "INR",

    salesperson: bc.salespersonCode,

    shipmentDate: bc.requestedDeliveryDate,

    externalDocumentNo: bc.externalDocumentNo,

    locationCode: bc.locationCode,

    paymentTermsCode: bc.paymentTermsCode,
  };
}

function mapStagingLine(bc: any): SalesOrderLine {
  return {
    id: `${bc.headerSystemId}-${bc.lineNo}`,

    orderId: bc.headerSystemId,

    lineNo: bc.lineNo,

    itemNo: bc.itemNo,

    description: bc.description,

    quantity: Number(bc.quantity || 0),

    unitPrice: Number(bc.unitPrice || 0),

    lineAmount: Number(bc.quantity || 0) * Number(bc.unitPrice || 0),

    discountPercent: Number(bc.discountPercent || 0),

    unitOfMeasureCode: bc.unitOfMeasureCode,

    type: "Item",
  };
}
