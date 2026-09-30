import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
  COMPANY_NAME,
} from "@/constants";

import { InventoryItem } from "@/types";
import { getOAuthToken } from "../auth/tokenService";
import { useAuthStore } from "@/store/authStore";

const user = useAuthStore.getState().user;

async function bcGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const searchParams = new URLSearchParams(params);
  const tokenData = await getOAuthToken();

  const url =
    `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
    `/ODataV4/company('${COMPANY_NAME}')${path}` +
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

function buildCategoryFilter(): string {
  const categories = (user?.ItemCat ?? "")
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);

  if (!categories.length) return "";

  return `(${categories
    .map((c) => `itemCategoryCode eq '${c.replace(/'/g, "''")}'`)
    .join(" or ")})`;
}

export interface InventoryParams {
  locationCode?: string;
  search?: string;
}

export async function getInventory(
  params: InventoryParams = {},
): Promise<InventoryItem[]> {
  try {
    const filters = ["displayName ne ''", "blocked eq false"];

    const categoryFilter = buildCategoryFilter();
    if (categoryFilter) filters.push(categoryFilter);

    if (params.locationCode?.trim()) {
      filters.push(
        `locationCode eq '${params.locationCode.replace(/'/g, "''")}'`,
      );
    }

    if (params.search?.trim()) {
      const search = params.search.replace(/'/g, "''");
      filters.push(
        `(contains(displayName,'${search}') or contains(number,'${search}'))`,
      );
    }

    const data = await bcGet<{ value: any[] }>("/velvotixitems", {
      $top: "5000",
      $filter: filters.join(" and "),
    });

    return data.value.map(mapInventoryItem);
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return [];
  }
}

export function mapInventoryItem(bc: any): InventoryItem {
  return {
    id: bc.id,
    no: bc.number,
    description: bc.displayName || bc.displayName2 || "",
    description2: bc.displayName2,
    type: bc.type,
    itemCategoryCode: bc.itemCategoryCode,
    blocked: Boolean(bc.blocked),
    gtin: bc.gtin,
    unitPrice: Number(bc.unitPrice || 0),
    unitCost: Number(bc.unitCost || 0),
    unitOfMeasureCode: bc.baseUnitOfMeasureCode || "PCS",
    locationCode: bc.locationCode || "",
    inventory: Number(bc.inventory || 0),
    lastModifiedDateTime: bc.lastModifiedDateTime,
  };
}
