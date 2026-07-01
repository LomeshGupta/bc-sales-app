import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
} from "@/constants";

import { BCLocation } from "@/types";
import { getOAuthToken } from "../auth/tokenService";

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
    throw new Error(
      `Business Central API Error ${res.status}: ${await res.text()}`,
    );
  }

  return res.json();
}

// ======================================================
// GET LOCATIONS
// ======================================================

export async function getLocations(search?: string): Promise<BCLocation[]> {
  try {
    const params: Record<string, string> = {
      $top: "500",
      $orderby: "displayName asc",
    };

    if (search?.trim()) {
      const value = search.replace(/'/g, "''");

      params.$filter = [
        `contains(displayName,'${value}')`,
        `contains(code,'${value}')`,
        `contains(city,'${value}')`,
        `contains(contact,'${value}')`,
      ].join(" or ");
    }

    const data = await bcGet<{ value: any[] }>("/locations", params);

    return data.value.map(mapBCLocation);
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return [];
  }
}

// ======================================================
// GET LOCATION BY CODE
// ======================================================

export async function getLocationByCode(
  code: string,
): Promise<BCLocation | null> {
  try {
    const escapedCode = code.replace(/'/g, "''");

    const data = await bcGet<{ value: any[] }>("/locations", {
      $filter: `code eq '${escapedCode}'`,
      $top: "1",
    });

    if (!data.value.length) {
      return null;
    }

    return mapBCLocation(data.value[0]);
  } catch (error) {
    console.error(`Failed to fetch location ${code}:`, error);
    return null;
  }
}

// ======================================================
// GET LOCATION BY ID
// ======================================================

export async function getLocationById(id: string): Promise<BCLocation | null> {
  try {
    const data = await bcGet<any>(`/locations(${id})`);

    return mapBCLocation(data);
  } catch (error) {
    console.error(`Failed to fetch location ${id}:`, error);
    return null;
  }
}

// ======================================================
// GET ALL LOCATIONS
// ======================================================

export async function getAllLocations(): Promise<BCLocation[]> {
  try {
    const data = await bcGet<{ value: any[] }>("/locations", {
      $top: "5000",
      $orderby: "displayName asc",
    });

    return data.value.map(mapBCLocation);
  } catch (error) {
    console.error("Failed to fetch all locations:", error);
    return [];
  }
}

// ======================================================
// LOCATION MAPPER
// ======================================================

export function mapBCLocation(bc: any): BCLocation {
  return {
    id: bc.id,
    code: bc.code,
    displayName: bc.displayName,
    contact: bc.contact,
    addressLine1: bc.addressLine1,
    addressLine2: bc.addressLine2,
    city: bc.city,
    state: bc.state,
    country: bc.country,
    postalCode: bc.postalCode,
    phoneNumber: bc.phoneNumber,
    email: bc.email,
    website: bc.website,
    lastModifiedDateTime: bc.lastModifiedDateTime,
  };
}
