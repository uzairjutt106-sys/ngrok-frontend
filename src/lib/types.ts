export type Transaction = {
  id: number;
  item_name: string;
  purchase_rate: number;
  sale_rate: number;
  quantity_kg: number;
  transaction_date: string;
};

export type TransactionPayload = Omit<Transaction, 'id' | 'transaction_date'> & {
  transaction_date?: string;
};

export type TransactionResponse = {
  total_records: number;
  transactions: Transaction[];
};

export type DailySummary = {
  transaction_date: string;
  total_qty_kg: number;
  total_profit: number;
};

export type DailySummaryResponse = {
  rows: DailySummary[];
};

export type ItemsResponse = {
  items: string[];
};
