import type { Item, InventoryItem, DailySummary, Transaction } from './types';

// MOCK DATABASE
const MOCK_ITEMS: Item[] = [
  { id: '1', name: 'Copper' },
  { id: '2', name: 'Aluminum' },
  { id: '3', name: 'Steel' },
  { id: '4', name: 'Brass' },
  { id: '5', name: 'Lead' },
];

let MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv1',
    item: MOCK_ITEMS[0],
    weight: 150.5,
    currentValue: 9030,
    lastUpdated: new Date(
      new Date().setDate(new Date().getDate() - 2)
    ).toISOString(),
  },
  {
    id: 'inv2',
    item: MOCK_ITEMS[1],
    weight: 320.0,
    currentValue: 6400,
    lastUpdated: new Date(
      new Date().setDate(new Date().getDate() - 1)
    ).toISOString(),
  },
  {
    id: 'inv3',
    item: MOCK_ITEMS[2],
    weight: 1200.75,
    currentValue: 4803,
    lastUpdated: new Date(
      new Date().setDate(new Date().getDate() - 5)
    ).toISOString(),
  },
];

// MOCK API FUNCTIONS
const apiDelay = () =>
  new Promise((res) => setTimeout(res, Math.random() * 400 + 100));

export async function getItems(): Promise<Item[]> {
  await apiDelay();
  return MOCK_ITEMS;
}

export async function getInventory(): Promise<InventoryItem[]> {
  await apiDelay();
  return [...MOCK_INVENTORY].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
}

export async function checkHealth(): Promise<{ status: 'ok' | 'error' }> {
  await apiDelay();
  // Simulate a 10% chance of failure
  if (Math.random() < 0.1) {
    return { status: 'error' };
  }
  return { status: 'ok' };
}

export async function addTransaction(transaction: {
  itemId: string;
  weight: number;
  price: number;
}): Promise<{ success: boolean }> {
  await apiDelay();
  const { itemId, weight, price } = transaction;
  const item = MOCK_ITEMS.find((i) => i.id === itemId);
  if (!item) return { success: false };

  const inventoryItem = MOCK_INVENTORY.find((i) => i.item.id === itemId);
  if (inventoryItem) {
    inventoryItem.weight += weight;
    inventoryItem.currentValue += price;
    inventoryItem.lastUpdated = new Date().toISOString();
  } else {
    MOCK_INVENTORY.push({
      id: `inv${MOCK_INVENTORY.length + 1}`,
      item,
      weight,
      currentValue: price,
      lastUpdated: new Date().toISOString(),
    });
  }
  return { success: true };
}

export async function getDailySummary(
  startDate: Date,
  endDate: Date
): Promise<DailySummary[]> {
  await apiDelay();

  const summary: DailySummary[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const purchases = Math.random() * 5000 + 1000;
    const sales = Math.random() * 6000 + 500;
    const expenses = Math.random() * 500;
    const profit = sales - purchases - expenses;
    summary.push({
      date: currentDate.toISOString().split('T')[0],
      purchases,
      sales,
      expenses,
      profit,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return summary;
}
