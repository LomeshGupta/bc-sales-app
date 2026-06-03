import { Report } from '@/types';

export const REPORTS: Report[] = [
  { id: 'r1', title: 'Sales by Customer', description: 'Detailed breakdown of sales performance per customer for the selected period', category: 'sales', lastGenerated: '2024-01-15', icon: 'PeopleAlt' },
  { id: 'r2', title: 'Monthly Sales Summary', description: 'Month-over-month sales comparison with trend analysis and forecasting', category: 'sales', lastGenerated: '2024-01-14', icon: 'BarChart' },
  { id: 'r3', title: 'Top Products Report', description: 'Best-selling products ranked by revenue, quantity, and margin', category: 'sales', lastGenerated: '2024-01-13', icon: 'Inventory2' },
  { id: 'r4', title: 'Outstanding Receivables', description: 'Aged accounts receivable with payment status and collection priority', category: 'finance', lastGenerated: '2024-01-15', icon: 'AccountBalance' },
  { id: 'r5', title: 'Cash Flow Forecast', description: 'Projected cash inflows and outflows based on open orders and invoices', category: 'finance', icon: 'TrendingUp' },
  { id: 'r6', title: 'Customer Credit Analysis', description: 'Credit utilization and risk assessment for all active customers', category: 'customers', lastGenerated: '2024-01-12', icon: 'CreditScore' },
  { id: 'r7', title: 'Salesperson Performance', description: 'Individual and team sales metrics, targets vs actuals, and commissions', category: 'sales', lastGenerated: '2024-01-10', icon: 'PersonSearch' },
  { id: 'r8', title: 'Inventory Valuation', description: 'Current inventory levels, valuation methods, and stock movement', category: 'inventory', icon: 'Warehouse' },
];

export async function getReports(): Promise<Report[]> {
  await new Promise((r) => setTimeout(r, 500));
  return REPORTS;
}

export async function generateReport(reportId: string): Promise<{ url: string }> {
  await new Promise((r) => setTimeout(r, 2000));
  return { url: `/reports/generated/${reportId}.pdf` };
}
