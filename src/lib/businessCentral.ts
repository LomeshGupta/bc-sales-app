import axios from "axios";
import {
  BC_TENANT_ID,
  BC_ENV_NAME,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
} from "@/constants";
import {
  getOAuthToken,
  calculateTokenExpiry,
} from "../services/auth/tokenService";

export const bcApiClient = axios.create({
  baseURL: `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}/api/v2.0/companies(${BC_COMPANY_ID})`,
});

export const bcODataClient = axios.create({
  baseURL: `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}/ODataV4/Company('My%20Company')`,
});

bcApiClient.interceptors.request.use(async (config) => {
  const token = await getOAuthToken();

  config.headers.Authorization = `Bearer ${token}`;
  config.headers.Accept = "application/json";

  return config;
});

bcODataClient.interceptors.request.use(async (config) => {
  const token = await getOAuthToken();

  config.headers.Authorization = `Bearer ${token}`;
  config.headers.Accept = "application/json";

  return config;
});
