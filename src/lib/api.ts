import type {
  Transaction,
  TransactionPayload,
  TransactionResponse,
  DailySummaryResponse,
  ItemsResponse,
} from './types';

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const { headers, ...rest } = options;
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY || '',
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    console.error(`API Error: ${res.status} ${res.statusText}`, errorBody);
    throw new Error(
      errorBody.detail || `Request failed with status ${res.status}`
    );
  }
  return res.json();
};

export async function getItems(): Promise<ItemsResponse> {
  return apiFetch('/items');
}

export async function getTransactions(
  limit = 10,
  offset = 0
): Promise<TransactionResponse> {
  return apiFetch(`/transactions?limit=${limit}&offset=${offset}`);
}

export async function checkHealth(): Promise<{ ok: boolean }> {
  // Health check does not need API key
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) return { ok: false };
  const data = await res.json();
  return data;
}

export async function addTransaction(
  transaction: TransactionPayload
): Promise<{ message: string }> {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
}

export async function getDailySummary(
  date_from: Date,
  date_to: Date
): Promise<DailySummaryResponse> {
  const from = date_from.toISOString().split('T')[0];
  const to = date_to.toISOString().split('T')[0];
  return apiFetch(`/summary/daily?date_from=${from}&date_to=${to}`);
}
