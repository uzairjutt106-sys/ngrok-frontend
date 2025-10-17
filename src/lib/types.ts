export type Item = {
  id: string;
  name: string;
};

export type InventoryItem = {
  id: string;
  item: Item;
  weight: number; // in kgs
  currentValue: number; // total value for this stock
  lastUpdated: string;
};

export type Transaction = {
  itemId: string;
  weight: number;
  price: number;
  type: 'purchase' | 'sale';
};

export type DailySummary = {
  date: string;
  purchases: number;
  sales: number;
  expenses: number;
  profit: number;
};
