import { getItems, getTransactions, getDailySummary } from '@/lib/api';
import Header from '@/components/dashboard/header';
import InventoryView from '@/components/dashboard/inventory-view';
import TransactionForm from '@/components/dashboard/transaction-form';
import ReportsView from '@/components/dashboard/reports-view';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Scale, Boxes } from 'lucide-react';
import { DailySummary } from '@/lib/types';

export default async function DashboardPage() {
  const [items, transactions, dailySummary] = await Promise.all([
    getItems(),
    getTransactions(),
    getDailySummary(
      new Date(new Date().setDate(new Date().getDate() - 30)),
      new Date()
    ),
  ]);

  const totalProfit = dailySummary.rows.reduce(
    (sum: number, item: DailySummary) => sum + item.total_profit,
    0
  );
  const totalWeight = dailySummary.rows.reduce(
    (sum: number, item: DailySummary) => sum + item.total_qty_kg,
    0
  );
  const totalItemTypes = items.items.length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Profit (Last 30 Days)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalProfit.toLocaleString('en-US')}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on sales and purchases
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Weight (Last 30 Days)
              </CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalWeight.toLocaleString('en-US')} kgs
              </div>
              <p className="text-xs text-muted-foreground">
                Total weight transacted
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Item Types</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItemTypes}</div>
              <p className="text-xs text-muted-foreground">
                Distinct item categories
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Record Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionForm items={items.items} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Generate Report</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportsView />
              </CardContent>
            </Card>
          </div>
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryView transactions={transactions.transactions} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
