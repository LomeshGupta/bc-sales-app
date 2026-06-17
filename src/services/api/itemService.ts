import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
} from "@/constants";

import { BCItem } from "@/types";
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
// GET ITEMS
// ======================================================

export async function getItems(search?: string): Promise<BCItem[]> {
  try {
    const params: Record<string, string> = {
      $top: "500",
      $orderby: "displayName asc",
      $filter:
        "displayName ne '' and blocked eq false and ItemCategoryCode eq '" +
        user?.ItemCat +
        "'",
    };

    if (search?.trim()) {
      const escapedSearch = search.replace(/'/g, "''");

      params.$filter =
        `contains(displayName,'${escapedSearch}') or ` +
        `contains(number,'${escapedSearch}')`;
    }

    const data = await bcGet<{
      value: any[];
    }>("/items", params);

    return data.value.map(mapBCItem);
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return [];
  }
}

// ======================================================
// GET ITEM BY NUMBER
// ======================================================

export async function getItemByNo(itemNo: string): Promise<BCItem | null> {
  try {
    const data = await bcGet<{
      value: any[];
    }>("/items", {
      $filter: `number eq '${itemNo}'`,
      $top: "1",
    });

    if (!data.value.length) {
      return null;
    }

    return mapBCItem(data.value[0]);
  } catch (error) {
    console.error(`Failed to fetch item ${itemNo}:`, error);

    return null;
  }
}

// ======================================================
// GET ITEM BY ID
// ======================================================

export async function getItemById(id: string): Promise<BCItem | null> {
  try {
    const data = await bcGet<any>(`/items(${id})`);

    return mapBCItem(data);
  } catch (error) {
    console.error(`Failed to fetch item ${id}:`, error);

    return null;
  }
}

// ======================================================
// GET ALL ITEMS
// ======================================================

export async function getAllItems(): Promise<BCItem[]> {
  try {
    const data = await bcGet<{
      value: any[];
    }>("/items", {
      $top: "5000",
      $orderby: "displayName asc",
      $filter:
        "displayName ne '' and blocked eq 'false' and ItemCategoryCode eq '" +
        user?.ItemCat +
        "'",
    });

    return data.value.map(mapBCItem);
  } catch (error) {
    console.error("Failed to fetch all items:", error);

    return [];
  }
}

// ======================================================
// BC ITEM MAPPER
// ======================================================

export function mapBCItem(bc: any): BCItem {
  return {
    id: bc.id,

    no: bc.number,

    description: bc.displayName || bc.displayName2 || "",

    unitPrice: Number(bc.unitPrice || bc.unitCost || 0),

    unitOfMeasureCode: bc.baseUnitOfMeasureCode || "PCS",

    inventory: Number(bc.inventory || 0),

    itemCategoryCode: bc.itemCategoryCode,

    type: bc.type,
  };
}
