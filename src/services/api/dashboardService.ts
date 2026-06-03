import axiosClient from '@/services/api/axiosClient';
import { KPICard, SalesSummary, RecentActivity } from '@/types';

// Mock data for demo/development
const MOCK_KPIs: KPICard[] = [
  { id: '1', title: 'Total Revenue', value: 284750, change: 12.5, changeType: 'increase', currency: true, icon: 'TrendingUp', color: '#D32F2F' },
  { id: '2', title: 'Open Orders', value: 47, change: 3.2, changeType: 'increase', currency: false, icon: 'ShoppingCart', color: '#2196F3' },
  { id: '3', title: 'Active Customers', value: 128, change: -1.8, changeType: 'decrease', currency: false, icon: 'People', color: '#4CAF50' },
  { id: '4', title: 'Avg Order Value', value: 6058, change: 8.7, changeType: 'increase', currency: true, icon: 'BarChart', color: '#FF9800' },
];

const MOCK_SALES_SUMMARY: SalesSummary[] = [
  { period: 'Jan', amount: 42000, orders: 28, customers: 18 },
  { period: 'Feb', amount: 38500, orders: 24, customers: 15 },
  { period: 'Mar', amount: 51000, orders: 32, customers: 22 },
  { period: 'Apr', amount: 47800, orders: 29, customers: 20 },
  { period: 'May', amount: 63200, orders: 41, customers: 31 },
  { period: 'Jun', amount: 58900, orders: 37, customers: 27 },
  { period: 'Jul', amount: 71500, orders: 45, customers: 35 },
  { period: 'Aug', amount: 68000, orders: 43, customers: 33 },
  { period: 'Sep', amount: 76300, orders: 48, customers: 38 },
  { period: 'Oct', amount: 82000, orders: 52, customers: 41 },
  { period: 'Nov', amount: 91000, orders: 58, customers: 45 },
  { period: 'Dec', amount: 105000, orders: 67, customers: 53 },
];

const MOCK_ACTIVITY: RecentActivity[] = [
  { id: '1', type: 'order', description: 'SO-10045 created for Fabrikam Inc', time: '2 min ago', amount: 12500, status: 'Open' },
  { id: '2', type: 'payment', description: 'Payment received from Contoso Ltd', time: '15 min ago', amount: 8750 },
  { id: '3', type: 'customer', description: 'New customer: Alpine Ski House', time: '1 hr ago' },
  { id: '4', type: 'shipment', description: 'SO-10038 shipped to Wingtip Toys', time: '2 hr ago', status: 'Shipped' },
  { id: '5', type: 'order', description: 'SO-10044 released for Northwind', time: '3 hr ago', amount: 5200, status: 'Released' },
  { id: '6', type: 'order', description: 'SO-10043 pending approval', time: '5 hr ago', amount: 15800, status: 'Pending Approval' },
];

export async function getDashboardKPIs(): Promise<KPICard[]> {
  try {
    const response = await axiosClient.get('/dashboardKPIs');
    return response.data.value || MOCK_KPIs;
  } catch {
    return MOCK_KPIs;
  }
}

export async function getSalesSummary(): Promise<SalesSummary[]> {
  try {
    const response = await axiosClient.get('/salesSummary');
    return response.data.value || MOCK_SALES_SUMMARY;
  } catch {
    return MOCK_SALES_SUMMARY;
  }
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  try {
    const response = await axiosClient.get('/recentActivity');
    return response.data.value || MOCK_ACTIVITY;
  } catch {
    return MOCK_ACTIVITY;
  }
}
