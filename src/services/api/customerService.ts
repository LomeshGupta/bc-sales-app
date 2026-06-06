import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
} from "@/constants";

import { Customer, PaginationParams, PaginatedResponse } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { getOAuthToken, calculateTokenExpiry } from "../auth/tokenService";

async function bcGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const searchParams = new URLSearchParams(params);
  const tokenData = await getOAuthToken();
  const url =
    `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
    `/api/v2.0/companies(${BC_COMPANY_ID})${path}` +
    `?${searchParams.toString()}`;
  console.log(url);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
      Prefer: "odata.include-annotations=*",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();

    throw new Error(`Business Central API Error ${res.status}: ${errorText}`);
  }

  return res.json();
}

export async function getCustomers(
  params: PaginationParams,
): Promise<PaginatedResponse<Customer>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search } = params;

  try {
    const bcParams: Record<string, string> = {
      $top: String(pageSize),
      $skip: String((page - 1) * pageSize),
      $count: "true",
    };
    console.log(search);
    if (search?.trim()) {
      const escapedSearch = search.replace(/'/g, "''");
      console.log(escapedSearch);
      bcParams["$filter"] = `contains(displayName,'${escapedSearch}')`;
    }

    const data = await bcGet<{
      value: any[];
      "@odata.count"?: number;
    }>("/customers", bcParams);

    const total = data["@odata.count"] ?? data.value.length;

    return {
      data: data.value.map(mapBCCustomer),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Failed to fetch customers:", error);

    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Fetch all customers (for dropdowns/autocomplete)
 */
export async function getAllCustomers(): Promise<Customer[]> {
  try {
    const data = await bcGet<{ value: any[] }>("/customers", {
      $top: "5000",
      $orderby: "displayName asc",
    });

    return data.value.map(mapBCCustomer);
  } catch (error) {
    console.error("Failed to fetch all customers:", error);
    return [];
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const data = await bcGet<any>(`/customers(${id})`);

    return mapBCCustomer(data);
  } catch (error) {
    console.error(`Failed to fetch customer ${id}:`, error);
    return null;
  }
}

export function mapBCCustomer(bc: any): Customer {
  return {
    id: bc.id,

    no: bc.number,

    name: bc.displayName,

    address: [bc.addressLine1, bc.addressLine2].filter(Boolean).join(", "),

    city: bc.city,

    country: bc.country,

    phone: bc.phoneNumber,

    email: bc.email,

    balance: Number(bc.balanceDue || 0),

    creditLimit: Number(bc.creditLimit || 0),

    currency: bc.currencyCode || "INR",

    salesperson: bc.salespersonCode,

    customerGroup: bc.type,

    blocked: bc.blocked !== "" && bc.blocked !== "_x0020_",
  };
}
