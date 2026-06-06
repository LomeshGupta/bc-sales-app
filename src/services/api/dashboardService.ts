import { KPICard, SalesSummary, RecentActivity } from "@/types";
import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
} from "@/constants";

import { getOAuthToken } from "../auth/tokenService";

/* -------------------------------------------------------------------------- */
/*                                API HELPER                                   */
/* -------------------------------------------------------------------------- */

async function bcGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const searchParams = new URLSearchParams(params);

  const tokenData = await getOAuthToken();

  let url =
    `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
    `/ODataV4/Company('${BC_COMPANY_ID}')/${path}`;

  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`;
  }

  console.log("Fetching BC Data:", url);

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

/* -------------------------------------------------------------------------- */
/*                                   KPIs                                     */
/* -------------------------------------------------------------------------- */

interface BCKPI {
  id: string;
  title: string;
  value: string;
  trend: number;
  trendDirection: "up" | "down";
}

export async function getDashboardKPIs(): Promise<KPICard[]> {
  try {
    const data = await bcGet<{ value: BCKPI[] }>("dashboardKPIs");

    return data.value.map((item) => {
      const numericValue = Number(String(item.value).replace(/,/g, ""));

      return {
        id: item.id,
        title: item.title,
        value: numericValue,

        change: item.trend,
        changeType: item.trendDirection === "up" ? "increase" : "decrease",

        currency:
          item.title === "Total Revenue" || item.title === "Avg Order Value",

        icon:
          item.title === "Total Customers"
            ? "People"
            : item.title === "Open Orders"
              ? "ShoppingCart"
              : item.title === "Total Revenue"
                ? "TrendingUp"
                : "BarChart",

        color:
          item.title === "Total Customers"
            ? "#4CAF50"
            : item.title === "Open Orders"
              ? "#2196F3"
              : item.title === "Total Revenue"
                ? "#D32F2F"
                : "#FF9800",
      };
    });
  } catch (error) {
    console.error("Failed to fetch KPI data:", error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                              SALES SUMMARY                                 */
/* -------------------------------------------------------------------------- */

interface BCSalesSummary {
  postingDate: number;
  postingYear: number;
  totalSales: number;
}

export async function getSalesSummary(): Promise<SalesSummary[]> {
  try {
    const data = await bcGet<{ value: BCSalesSummary[] }>("salesSummary");

    return data.value.map((item) => ({
      period: item.postingYear.toString(),
      amount: item.totalSales,

      // Not currently returned by BC endpoint
      orders: 0,
      customers: 0,
    }));
  } catch (error) {
    console.error("Failed to fetch Sales Summary:", error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                              RECENT ACTIVITY                               */
/* -------------------------------------------------------------------------- */

interface BCRecentActivity {
  id: string;
  type: string;
  documentNo: string;
  customerName: string;
  amount: number;
  date: string;
  description: string;
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  try {
    const data = await bcGet<{ value: BCRecentActivity[] }>("recentActivity", {
      $top: "6",
    });

    return data.value.map((item) => {
      const typeMap: Record<string, RecentActivity["type"]> = {
        Order: "order",
        Payment: "payment",
        Customer: "customer",
        Shipment: "shipment",
      };

      return {
        id: item.id,
        type: typeMap[item.type] ?? "order",
        description: item.description,
        amount: item.amount,
        status: item.type,
        time: item.date,
      };
    });
  } catch (error) {
    console.error("Failed to fetch Recent Activity:", error);
    return [];
  }
}
