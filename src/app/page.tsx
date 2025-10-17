import { getItems, getInventory } from '@/lib/api';
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

export default async function DashboardPage() {
  const inventory = await getInventory();
  const items = await getItems();

  const totalValue = inventory.reduce((sum, item) => sum + item.currentValue, 0);
  const totalWeight = inventory.reduce((sum, item) => sum + item.weight, 0);
  const totalItemTypes = inventory.length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Inventory Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalValue.toLocaleString('en-US')}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all scrap types
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Inventory Weight
              </CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalWeight.toLocaleString('en-US')} kgs
              </div>
              <p className="text-xs text-muted-foreground">
                Total weight in stock
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
                Distinct scrap categories
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add Scrap Item</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionForm items={items} />
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
              <CardTitle>Current Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryView inventory={inventory} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
