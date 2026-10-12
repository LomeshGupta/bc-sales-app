import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
} from "@/constants";

import { BCPaymentTerm } from "@/types";
import { getOAuthToken } from "../auth/tokenService";
import { useAuthStore } from "@/store/authStore";
import { bcFetch } from "./bcRequest";

// ======================================================
// BC HELPER
// ======================================================

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

  const res = await bcFetch(url, {
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

// ======================================================
// GET PAYMENT TERMS
// ======================================================

export async function getpaymentTerms(
  search?: string,
): Promise<BCPaymentTerm[]> {
  try {
    // IMPORTANT:
    // Get the current user at request time.
    // Do NOT define this at module level.
    const user = useAuthStore.getState().user;

    if (!user) {
      console.warn("getpaymentTerms: No authenticated user available.");

      return [];
    }

    let filter = "displayName ne ''";

    if (search?.trim()) {
      const escapedSearch = search.replace(/'/g, "''");

      filter +=
        ` and (` +
        `contains(displayName,'${escapedSearch}') or ` +
        `contains(code,'${escapedSearch}')` +
        `)`;
    }

    const params: Record<string, string> = {
      $filter: filter,
      $orderby: "displayName asc",
    };

    const data = await bcGet<{ value: any[] }>("/paymentterms", params);

    return data.value.map(mapBCPaymentTerm);
  } catch (error) {
    console.error("Failed to fetch paymentTerms:", error);

    return [];
  }
}

// ======================================================
// GET PAYMENT TERM BY NUMBER
// ======================================================

export async function getItemByNo(
  itemNo: string,
): Promise<BCPaymentTerm | null> {
  try {
    const user = useAuthStore.getState().user;

    if (!user) {
      console.warn("getItemByNo: No authenticated user available.");

      return null;
    }

    const escapedItemNo = itemNo.replace(/'/g, "''");

    const data = await bcGet<{
      value: any[];
    }>("/paymentterms", {
      $filter: `code eq '${escapedItemNo}'`,
      $top: "1",
    });

    if (!data.value.length) {
      return null;
    }

    return mapBCPaymentTerm(data.value[0]);
  } catch (error) {
    console.error(`Failed to fetch payment term ${itemNo}:`, error);

    return null;
  }
}

// ======================================================
// GET PAYMENT TERM BY ID
// ======================================================

export async function getItemById(id: string): Promise<BCPaymentTerm | null> {
  try {
    const user = useAuthStore.getState().user;

    if (!user) {
      console.warn("getItemById: No authenticated user available.");

      return null;
    }

    const data = await bcGet<any>(`/paymentterms(${id})`);

    return mapBCPaymentTerm(data);
  } catch (error) {
    console.error(`Failed to fetch payment term ${id}:`, error);

    return null;
  }
}

// ======================================================
// GET ALL PAYMENT TERMS
// ======================================================

export async function getAllpaymentTerms(): Promise<BCPaymentTerm[]> {
  try {
    const user = useAuthStore.getState().user;

    if (!user) {
      console.warn("getAllpaymentTerms: No authenticated user available.");

      return [];
    }

    const data = await bcGet<{ value: any[] }>("/paymentterms", {
      $orderby: "displayName asc",
    });

    return data.value.map(mapBCPaymentTerm);
  } catch (error) {
    console.error("Failed to fetch all paymentTerms:", error);

    return [];
  }
}

// ======================================================
// BC PAYMENT TERM MAPPER
// ======================================================

export function mapBCPaymentTerm(bc: any): BCPaymentTerm {
  return {
    id: bc?.id,
    no: bc?.code ?? "",
    description: bc?.displayName ?? bc?.displayName2 ?? "",
  };
}
