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



import { bcFetch } from "./bcRequest";

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

function buildCategoryFilter(): string {
  const user = useAuthStore.getState().user;
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
    const user = useAuthStore.getState().user;
    if (!user?.ItemCat?.trim()) return [];
    const filters = ["displayName ne ''", "blocked eq false"];

    const categoryFilter = buildCategoryFilter();
    if (!categoryFilter) return [];
    filters.push(categoryFilter);

    if (params.locationCode?.trim()) {
      filters.push(
        `locationCode eq '${params.locationCode.replace(/'/g, "''")}'`,
      );
    }

    const select =
      "id,number,displayName,displayName2,type,itemCategoryCode,blocked,baseUnitOfMeasureCode,locationCode,inventory,unitCost,lastModifiedDateTime";

    // Business Central OData does not support OR filters across distinct fields
    // in this scenario. Searching displayName OR number in one $filter therefore
    // causes the inventory query to fail. Run one query per searchable field and
    // merge the results locally. Common security/location/category filters are
    // applied to both requests.
    if (params.search?.trim()) {
      const escapedSearch = params.search.trim().replace(/'/g, "''");
      const commonFilter = filters.join(" and ");

      const [byDisplayName, byNumber] = await Promise.all([
        bcGet<{ value: any[] }>("/velvotixitems", {
          $top: "50",
          $select: select,
          $filter: `${commonFilter} and contains(displayName,'${escapedSearch}')`,
        }),
        bcGet<{ value: any[] }>("/velvotixitems", {
          $top: "50",
          $select: select,
          $filter: `${commonFilter} and contains(number,'${escapedSearch}')`,
        }),
      ]);

      const merged = new Map<string, any>();
      for (const row of [...byDisplayName.value, ...byNumber.value]) {
        if (row?.id) merged.set(String(row.id), row);
      }

      return Array.from(merged.values()).map(mapInventoryItem);
    }

    const data = await bcGet<{ value: any[] }>("/velvotixitems", {
      $top: "50",
      $select: select,
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
    channel: "MAIN WAREH",
    lastModifiedDateTime: bc.lastModifiedDateTime,
  };
}
