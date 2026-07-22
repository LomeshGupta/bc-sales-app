import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
} from "@/constants";

import { BCPaymentTerm } from "@/types";
import { getOAuthToken } from "../auth/tokenService";
import { useAuthStore } from "@/store/authStore";
const user = useAuthStore.getState().user;

// ======================================================
// BC HELPER
// ======================================================

async function bcGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const searchParams = new URLSearchParams(params);

  const tokenData = await getOAuthToken();
  console.log(user?.ItemCat);
  const url =
    `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
    `/api/v2.0/companies(${BC_COMPANY_ID})${path}` +
    `?${searchParams.toString()}`;

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

// ======================================================
// GET paymentTerms
// ======================================================

export async function getpaymentTerms(
  search?: string,
): Promise<BCPaymentTerm[]> {
  try {
    const categories = (user?.ItemCat ?? "")
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    const categoryFilter =
      categories.length > 0
        ? `(${categories
            .map((c) => `itemCategoryCode eq '${c}'`)
            .join(" or ")})`
        : "";

    let filter = ["displayName ne ''", "blocked eq false", categoryFilter]
      .filter(Boolean)
      .join(" and ");

    if (search?.trim()) {
      const escapedSearch = search.replace(/'/g, "''");

      filter +=
        ` and (` +
        `contains(displayName,'${escapedSearch}') or ` +
        `contains(number,'${escapedSearch}')` +
        `)`;
    }

    const params: Record<string, string> = {
      $orderby: "displayName asc",
      $filter: filter,
    };

    const data = await bcGet<{ value: any[] }>("/paymentterms", params);

    return data.value.map(mapBCPaymentTerm);
  } catch (error) {
    console.error("Failed to fetch paymentTerms:", error);
    return [];
  }
}

// ======================================================
// GET ITEM BY NUMBER
// ======================================================

export async function getItemByNo(
  itemNo: string,
): Promise<BCPaymentTerm | null> {
  try {
    const data = await bcGet<{
      value: any[];
    }>("/paymentterms", {
      $filter: `number eq '${itemNo}'`,
      $top: "1",
    });

    if (!data.value.length) {
      return null;
    }

    return mapBCPaymentTerm(data.value[0]);
  } catch (error) {
    console.error(`Failed to fetch item ${itemNo}:`, error);

    return null;
  }
}

// ======================================================
// GET ITEM BY ID
// ======================================================

export async function getItemById(id: string): Promise<BCPaymentTerm | null> {
  try {
    const data = await bcGet<any>(`/paymentterms(${id})`);

    return mapBCPaymentTerm(data);
  } catch (error) {
    console.error(`Failed to fetch item ${id}:`, error);

    return null;
  }
}

// ======================================================
// GET ALL paymentTerms
// ======================================================

export async function getAllpaymentTerms(): Promise<BCPaymentTerm[]> {
  try {
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
// BC ITEM MAPPER
// ======================================================

export function mapBCPaymentTerm(bc: any): BCPaymentTerm {
  return {
    id: bc?.id,
    no: bc?.code ?? "",
    description: bc?.displayName ?? bc?.displayName2 ?? "",
  };
}
