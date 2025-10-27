'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';

interface Transaction {
  id: number;
  item_name: string;
  purchase_rate: number;
  quantity_kg: number;
  transaction_date: string;
}

interface SaleEntry {
  id: number;
  item_name: string;
  sale_rate: number;
  quantity_kg: number;
  sale_date: string; // backend field
}

const API = 'http://127.0.0.1:8000';
const API_KEY = '@uzair143';
const today = () => new Date().toISOString().slice(0, 10);

export default function HomePage() {
  // -------------------- Purchases (Transactions) --------------------
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Add-purchase form (with date)
  const [itemName, setItemName] = useState('');
  const [purchaseRate, setPurchaseRate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today());

  // Filters for transactions
  const [filterItem, setFilterItem] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  // 👇 Daily Purchases: date selector (defaults to today)
  const [dayViewDate, setDayViewDate] = useState(today()); // YYYY-MM-DD

  // ---- Inline edit state ----
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editPurchaseRate, setEditPurchaseRate] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editDate, setEditDate] = useState(today());
  // === Daily-by-date section (server-driven) ===
const [dailyDate, setDailyDate] = useState(today()); // default today
const [dailyRows, setDailyRows] = useState<Transaction[]>([]);
const [dailyTotals, setDailyTotals] = useState<{ total_qty: number; total_amount: number }>({ total_qty: 0, total_amount: 0 });
const [dailyLoading, setDailyLoading] = useState(false);
const [dailyErr, setDailyErr] = useState<string | null>(null);

const fetchDaily = async (d: string) => {
  setDailyLoading(true);
  setDailyErr(null);
  try {
    const url = new URL(`${API}/transactions/daily`);
    url.searchParams.set("date_str", d);
    const resp = await fetch(url.toString(), { headers: { "X-API-Key": API_KEY }, cache: "no-store" });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`${resp.status} ${resp.statusText}: ${t}`);
    }
    const data = await resp.json();
    setDailyRows(data.rows || []);
    setDailyTotals(data.totals || { total_qty: 0, total_amount: 0 });
  } catch (e: any) {
    setDailyErr(e.message);
  } finally {
    setDailyLoading(false);
  }
};

// initial load
useEffect(() => { fetchDaily(dailyDate); }, []);

// whenever date changes
useEffect(() => { fetchDaily(dailyDate); }, [dailyDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/transactions`, {
        headers: { 'X-API-Key': API_KEY },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
      const data = await response.json();
      setTransactions(data.transactions || []);
      setConnected(true);
    } catch (err: any) {
      setError(err.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const pr = Number(purchaseRate);
    const q = Number(quantity);
    if (!Number.isFinite(pr) || pr <= 0 || !Number.isFinite(q) || q <= 0) {
      alert('Please enter valid purchase rate (int) and quantity (> 0).');
      return;
    }
    try {
      const response = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          item_name: itemName,
          purchase_rate: Math.trunc(pr),
          quantity_kg: q,
          transaction_date: purchaseDate,
        }),
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`${response.status} ${response.statusText}: ${txt}`);
      }
      await fetchTransactions();
      setItemName('');
      setPurchaseRate('');
      setQuantity('');
      setPurchaseDate(today());
    } catch (err: any) {
      alert('Failed to add transaction: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const response = await fetch(`${API}/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': API_KEY },
      });
      if (!response.ok) throw new Error(`Failed to delete (status ${response.status})`);
      await fetchTransactions();
      await fetchSales(); // keep stocks in sync
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // ---- Begin edit for a row ----
  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditItemName(t.item_name);
    setEditPurchaseRate(String(Math.trunc(t.purchase_rate)));
    setEditQuantity(String(t.quantity_kg));
    setEditDate(t.transaction_date.split('T')[0] || today());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditItemName('');
    setEditPurchaseRate('');
    setEditQuantity('');
    setEditDate(today());
  };

  const saveEdit = async (id: number) => {
    const pr = Number(editPurchaseRate);
    const q = Number(editQuantity);
    if (!editItemName.trim()) return alert('Item name required');
    if (!Number.isFinite(pr) || pr <= 0) return alert('Purchase rate must be a positive integer');
    if (!Number.isFinite(q) || q <= 0) return alert('Quantity must be > 0');
    if (!editDate) return alert('Date required');

    try {
      const resp = await fetch(`${API}/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          item_name: editItemName.trim(),
          purchase_rate: Math.trunc(pr),
          quantity_kg: q,
          transaction_date: editDate, // YYYY-MM-DD
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`${resp.status} ${resp.statusText}: ${txt}`);
      }
      await fetchTransactions();
      cancelEdit();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  // Filtered view of purchases
  const filteredTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date);
    const matchesItem =
      filterItem === '' || t.item_name.toLowerCase().includes(filterItem.toLowerCase());
    const matchesFrom = !fromDate || date >= new Date(fromDate);
    const matchesTo = !toDate || date <= new Date(toDate);
    return matchesItem && matchesFrom && matchesTo;
  });

  // ===== Daily PURCHASE summary (no purchase rate column) =====
  const dailyPurchaseSummary = useMemo(() => {
    const map: Record<string, { date: string; totalPurchaseAmount: number; totalQty: number }> = {};
    for (const t of filteredTransactions) {
      const day = t.transaction_date.split('T')[0];
      if (!map[day]) {
        map[day] = { date: day, totalPurchaseAmount: 0, totalQty: 0 };
      }
      map[day].totalPurchaseAmount += (t.purchase_rate || 0) * t.quantity_kg;
      map[day].totalQty += t.quantity_kg;
    }
    return Object.values(map).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filteredTransactions]);
  // 👇 Daily Purchases (filter by selected day)
const purchasesForDay = useMemo(() => {
  const d = dayViewDate;
  return transactions.filter((t) => t.transaction_date.split('T')[0] === d);
}, [transactions, dayViewDate]);

// 👇 Totals for the selected day
const totalsForDay = useMemo(() => {
  const totalQty = purchasesForDay.reduce((s, t) => s + t.quantity_kg, 0);
  const totalAmt = purchasesForDay.reduce(
    (s, t) => s + Math.trunc(t.purchase_rate) * t.quantity_kg,
    0
  );
  return { totalQty, totalAmt };
}, [purchasesForDay]);


  // -------------------- Sales (persisted on server) --------------------
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [saleItem, setSaleItem] = useState('');
  const [saleRateInput, setSaleRateInput] = useState('');
  const [saleQtyInput, setSaleQtyInput] = useState('');
  const [saleDate, setSaleDate] = useState(today());

  const fetchSales = async () => {
    try {
      const resp = await fetch(`${API}/sales`, {
        headers: { 'X-API-Key': API_KEY },
        cache: 'no-store',
      });
      if (!resp.ok) throw new Error(`HTTP error! ${resp.status}`);
      const data = await resp.json();
      setSales(data.sales || []);
    } catch (err: any) {
      console.error('Load sales failed:', err.message);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Weighted-average purchase rate per item (built from ALL purchases)
  const avgPurchaseByItem = useMemo(() => {
    const agg = new Map<string, { qty: number; cost: number }>();
    for (const t of transactions) {
      const key = t.item_name.trim().toLowerCase();
      const cost = Math.trunc(t.purchase_rate) * t.quantity_kg;
      const cur = agg.get(key) || { qty: 0, cost: 0 };
      cur.qty += t.quantity_kg;
      cur.cost += cost;
      agg.set(key, cur);
    }
    const out = new Map<string, number>();
    for (const [k, v] of agg.entries()) {
      out.set(k, v.qty > 0 ? v.cost / v.qty : 0);
    }
    return out;
  }, [transactions]);

  const getAvgPurchase = (item: string) =>
    avgPurchaseByItem.get(item.trim().toLowerCase()) ?? 0;

  const handleAddSale = async (e: FormEvent) => {
    e.preventDefault();
    const sr = Number(saleRateInput);
    const q = Number(saleQtyInput);
    if (!saleItem.trim()) return alert('Enter item name');
    if (!Number.isFinite(sr) || sr <= 0) return alert('Enter valid sale rate (> 0, integer)');
    if (!Number.isFinite(q) || q <= 0) return alert('Enter valid quantity (> 0)');

    try {
      const resp = await fetch(`${API}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          item_name: saleItem.trim(),
          sale_rate: Math.trunc(sr),
          quantity_kg: q,
          sale_date: saleDate,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`${resp.status} ${resp.statusText}: ${txt}`);
      }
      await fetchSales();
      setSaleItem('');
      setSaleRateInput('');
      setSaleQtyInput('');
      setSaleDate(today());
    } catch (err: any) {
      alert('Failed to add sale: ' + err.message);
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (!confirm('Delete this sale entry?')) return;
    try {
      const resp = await fetch(`${API}/sales/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': API_KEY },
      });
      if (!resp.ok) throw new Error(`Failed to delete sale (${resp.status})`);
      await fetchSales();
    } catch (err: any) {
      alert('Delete sale failed: ' + err.message);
    }
  };

  // ===== Stocks (Purchased, Sold, Net, Realized Profit) =====
  const stocksSummary = useMemo(() => {
    const purchasedByItem = new Map<string, number>();
    const soldByItem = new Map<string, number>();
    const profitByItem = new Map<string, number>();

    // Purchases
    for (const t of transactions) {
      const key = t.item_name.trim().toLowerCase();
      purchasedByItem.set(key, (purchasedByItem.get(key) || 0) + t.quantity_kg);
    }

    // Sales + realized profit using weighted avg purchase
    for (const s of sales) {
      const key = s.item_name.trim().toLowerCase();
      soldByItem.set(key, (soldByItem.get(key) || 0) + s.quantity_kg);

      const avg = getAvgPurchase(s.item_name);
      const profit = (s.sale_rate - avg) * s.quantity_kg;
      profitByItem.set(key, (profitByItem.get(key) || 0) + profit);
    }

    const items = new Set<string>([
      ...Array.from(purchasedByItem.keys()),
      ...Array.from(soldByItem.keys()),
    ]);

    const rows = Array.from(items).map((key) => {
      const purchased = purchasedByItem.get(key) || 0;
      const sold = soldByItem.get(key) || 0;
      const net = purchased - sold;
      const realizedProfit = profitByItem.get(key) || 0;
      return { itemName: key, purchased, sold, net, realizedProfit };
    });

    rows.sort((a, b) => a.itemName.localeCompare(b.itemName));
    return rows;
  }, [transactions, sales, avgPurchaseByItem]);

  // ========== NEW: Quick Quote (search item, show net weight, compute amount) ==========
  const [quoteItem, setQuoteItem] = useState('');
  const [quoteRate, setQuoteRate] = useState(''); // integers only
  const selectedStock = useMemo(() => {
    if (!quoteItem.trim()) return null;
    const key = quoteItem.trim().toLowerCase();
    return stocksSummary.find((r) => r.itemName === key) || null;
  }, [quoteItem, stocksSummary]);

  const parsedRate = Number(quoteRate);
  const validRate = Number.isFinite(parsedRate) && parsedRate > 0 ? Math.trunc(parsedRate) : 0;
  const quoteAmount = selectedStock ? selectedStock.net * validRate : 0;

  // -------------------- UI --------------------
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">Error: {error}</p>;

  return (
    <main className="max-w-6xl mx-auto p-8">
      {/* API Connection Status */}
      <div
        className={`text-center font-semibold mb-4 ${
          connected ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {connected ? '🟢 API Connected' : '🔴 API Disconnected'}
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">📦 Scrapit</h1>

      {/* Add PURCHASE (Transaction) */}
      <form
        onSubmit={handleAdd}
        className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-8 shadow-sm"
      >
        <h2 className="text-xl font-semibold mb-3">Add Purchase</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <input
            type="text"
            placeholder="Item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="border p-2 rounded w-full"
            required
            list="items-list"
          />
          <datalist id="items-list">
            {[...new Set(transactions.map((t) => t.item_name))].map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          {/* Integers only for purchase rate */}
          <input
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            placeholder="Purchase rate"
            value={purchaseRate}
            onChange={(e) => {
              const v = e.target.value.replace(/\D+/g, '');
              setPurchaseRate(v);
            }}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className="border p-2 rounded w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            required
          />

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="Quantity (kg)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className="border p-2 rounded w-full"
            required
          />

          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </form>

      {/* Filter Purchases */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Filter Purchases</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Filter by item"
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={async () => {
              await Promise.all([fetchTransactions(), fetchSales()]);
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Purchases Table (with inline edit) */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Purchase Rate</th>
              <th className="p-2 text-left">Quantity (kg)</th>
              <th className="p-2 text-left">Purchase Amount</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => {
              const isEditing = editingId === t.id;
              const amount = Math.trunc(t.purchase_rate) * t.quantity_kg;

              return (
                <tr key={t.id} className="border-t">
                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="text"
                        className="border p-1 rounded w-full"
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                      />
                    ) : (
                      t.item_name
                    )}
                  </td>

                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        step={1}
                        min={1}
                        className="border p-1 rounded w-full"
                        value={editPurchaseRate}
                        onChange={(e) =>
                          setEditPurchaseRate(e.target.value.replace(/\D+/g, ''))
                        }
                      />
                    ) : (
                      Math.trunc(t.purchase_rate)
                    )}
                  </td>

                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        className="border p-1 rounded w-full"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                      />
                    ) : (
                      t.quantity_kg.toFixed(2)
                    )}
                  </td>

                  <td className="p-2">{amount.toFixed(2)}</td>

                  <td className="p-2">
                    {isEditing ? (
                      <input
                        type="date"
                        className="border p-1 rounded w-full"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                    ) : (
                      t.transaction_date.split('T')[0]
                    )}
                  </td>

                  <td className="p-2 space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(t.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(t)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredTransactions.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={6}>
                  No purchases match the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Total Purchase Amount */}
        <div className="text-right mt-3 font-bold text-lg">
          Total Purchase:{' '}
          <span className="text-blue-600">
            {filteredTransactions
              .reduce((sum, t) => sum + Math.trunc(t.purchase_rate) * t.quantity_kg, 0)
              .toFixed(2)}
          </span>
        </div>
      </div>

      {/* 📅 Daily Purchases (per-day detail view) */}
<div className="overflow-x-auto mb-8">
  <div className="flex flex-wrap items-end gap-3 mb-3">
    <h2 className="text-2xl font-semibold">📅 Daily Purchase summary</h2>
    <div className="ml-auto flex items-center gap-2">
      <input
        type="date"
        value={dayViewDate}
        onChange={(e) => setDayViewDate(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        type="button"
        onClick={() => {
          const d = new Date(dayViewDate);
          d.setDate(d.getDate() - 1);
          setDayViewDate(d.toISOString().slice(0, 10));
        }}
        className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
      >
        ◀ Prev
      </button>
      <button
        type="button"
        onClick={() => setDayViewDate(today())}
        className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
      >
        Today
      </button>
      <button
        type="button"
        onClick={() => {
          const d = new Date(dayViewDate);
          d.setDate(d.getDate() + 1);
          setDayViewDate(d.toISOString().slice(0, 10));
        }}
        className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
      >
        Next ▶
      </button>
    </div>
  </div>

  <table className="w-full border border-gray-300 rounded-lg">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 text-left">Item</th>
        <th className="p-2 text-left">Purchase Rate</th>
        <th className="p-2 text-left">Quantity (kg)</th>
        <th className="p-2 text-left">Amount</th>
        <th className="p-2 text-left">Date</th>
      </tr>
    </thead>
    <tbody>
      {purchasesForDay.length ? (
        purchasesForDay.map((t) => {
          const amount = Math.trunc(t.purchase_rate) * t.quantity_kg;
          return (
            <tr key={t.id} className="border-t">
              <td className="p-2">{t.item_name}</td>
              <td className="p-2">{Math.trunc(t.purchase_rate)}</td>
              <td className="p-2">{t.quantity_kg.toFixed(2)}</td>
              <td className="p-2">{amount.toFixed(2)}</td>
              <td className="p-2">{t.transaction_date.split('T')[0]}</td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td className="p-3 text-gray-500" colSpan={5}>
            No purchases on {dayViewDate}.
          </td>
        </tr>
      )}
    </tbody>
    <tfoot>
      <tr className="bg-gray-50 font-semibold">
        <td className="p-2">Totals</td>
        <td className="p-2">—</td>
        <td className="p-2">{totalsForDay.totalQty.toFixed(2)}</td>
        <td className="p-2">{totalsForDay.totalAmt.toFixed(2)}</td>
        <td className="p-2">{dayViewDate}</td>
      </tr>
    </tfoot>
  </table>
</div>


      {/* 📦 Stocks (Purchased, Sold, Net, Realized Profit) */}
      <div className="overflow-x-auto mt-10">
        <h2 className="text-2xl font-semibold mb-3">📦 Stocks (Net Weight & Profit)</h2>
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Purchased (kg)</th>
              <th className="p-2 text-left">Sold (kg)</th>
              <th className="p-2 text-left">Net (kg)</th>
              <th className="p-2 text-left">Realized Profit</th>
            </tr>
          </thead>
          <tbody>
            {stocksSummary.length ? (
              stocksSummary.map((row) => (
                <tr key={row.itemName} className="border-t">
                  <td className="p-2 capitalize">{row.itemName}</td>
                  <td className="p-2">{row.purchased.toFixed(2)}</td>
                  <td className="p-2">{row.sold.toFixed(2)}</td>
                  <td className="p-2">{row.net.toFixed(2)}</td>
                  <td
                    className={`p-2 font-semibold ${
                      row.realizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {row.realizedProfit.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  No stock data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔎 NEW: Quick Quote (search item, show net weight, compute amount) */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-8 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">🔎 Search Item</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2 col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Item name</label>
            <input
              type="text"
              placeholder="Search item"
              value={quoteItem}
              onChange={(e) => setQuoteItem(e.target.value)}
              className="border p-2 rounded w-full"
              list="stocks-list"
            />
            <datalist id="stocks-list">
              {stocksSummary.map((r) => (
                <option key={r.itemName} value={r.itemName} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Net weight (kg)</label>
            <input
              readOnly
              value={selectedStock ? selectedStock.net.toFixed(2) : '0.00'}
              className="border p-2 rounded w-full bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Sale rate (int)</label>
            <input
              type="number"
              inputMode="numeric"
              step={1}
              min={1}
              placeholder="Sale rate"
              value={quoteRate}
              onChange={(e) => setQuoteRate(e.target.value.replace(/\D+/g, ''))}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="border p-2 rounded w-full"
            />
          </div>

          <div className="md:col-span-2 col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Amount (net × rate)</label>
            <input
              readOnly
              value={quoteAmount.toFixed(2)}
              className="border p-2 rounded w-full bg-gray-100"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Net = Purchased − Sold. Amount uses current net weight and the sale rate you enter here.
        </p>
      </div>

      {/* -------------------- Sales & Profit (Persisted) -------------------- */}
      <SalesPanel
        
        sales={sales}
        onReload={fetchSales}
        avgPurchaseByItem={avgPurchaseByItem}
        handleAddSale={handleAddSale}
        handleDeleteSale={handleDeleteSale}
        saleItem={saleItem}
        setSaleItem={setSaleItem}
        saleRateInput={saleRateInput}
        setSaleRateInput={setSaleRateInput}
        saleQtyInput={saleQtyInput}
        setSaleQtyInput={setSaleQtyInput}
        saleDate={saleDate}
        setSaleDate={setSaleDate}
      />{/* Profit reports (saved in profit_reports) */}
<ProfitPanel />

    </main>
  );
}

/* -------- Sales panel (kept same styling) -------- */
/* -------- Sales panel with filters -------- */
function SalesPanel({
  sales,
  onReload,
  avgPurchaseByItem,
  handleAddSale,
  handleDeleteSale,
  saleItem,
  setSaleItem,
  saleRateInput,
  setSaleRateInput,
  saleQtyInput,
  setSaleQtyInput,
  saleDate,
  setSaleDate,
}: {
  sales: SaleEntry[];
  onReload: () => Promise<void>;
  avgPurchaseByItem: Map<string, number>;
  handleAddSale: (e: FormEvent) => Promise<void>;
  handleDeleteSale: (id: number) => Promise<void>;
  saleItem: string;
  setSaleItem: (v: string) => void;
  saleRateInput: string;
  setSaleRateInput: (v: string) => void;
  saleQtyInput: string;
  setSaleQtyInput: (v: string) => void;
  saleDate: string;
  setSaleDate: (v: string) => void;
}) {
  const getAvgPurchase = (item: string) =>
    avgPurchaseByItem.get(item.trim().toLowerCase()) ?? 0;

  // 🔍 NEW: filters
  const [saleFilterItem, setSaleFilterItem] = useState("");
  const [saleFromDate, setSaleFromDate] = useState("");
  const [saleToDate, setSaleToDate] = useState("");

  // Apply filters (client-side) to sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesItem =
        saleFilterItem.trim() === "" ||
        s.item_name.toLowerCase().includes(saleFilterItem.trim().toLowerCase());

      const d = new Date(s.sale_date); // sale_date is "YYYY-MM-DD"
      const fromOk = !saleFromDate || d >= new Date(saleFromDate);
      const toOk = !saleToDate || d <= new Date(saleToDate);

      return matchesItem && fromOk && toOk;
    });
  }, [sales, saleFilterItem, saleFromDate, saleToDate]);

  // Recompute total profit for visible (filtered) rows
  const totalProfit = useMemo(() => {
    return filteredSales.reduce((sum, s) => {
      const avgPurchase = getAvgPurchase(s.item_name);
      return sum + (s.sale_rate - avgPurchase) * s.quantity_kg;
    }, 0);
  }, [filteredSales, avgPurchaseByItem]);

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-3">💰 Sales & Profit (Computed)</h2>

      {/* 🔍 NEW: Sales Filters */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2 col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Filter by item</label>
            <input
              type="text"
              placeholder="e.g. copper"
              value={saleFilterItem}
              onChange={(e) => setSaleFilterItem(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={saleFromDate}
              onChange={(e) => setSaleFromDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={saleToDate}
              onChange={(e) => setSaleToDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSaleFilterItem("");
                setSaleFromDate("");
                setSaleToDate("");
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onReload}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Sales
            </button>
          </div>
        </div>
      </div>

      {/* Add a Sale Entry (unchanged) */}
      <form
        onSubmit={handleAddSale}
        className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 shadow-sm"
      >
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Item name"
            value={saleItem}
            onChange={(e) => setSaleItem(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />

          {/* Integers only for sale rate */}
          <input
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            placeholder="Sale rate"
            value={saleRateInput}
            onChange={(e) => {
              const v = e.target.value.replace(/\D+/g, "");
              setSaleRateInput(v);
            }}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className="border p-2 rounded w-full"
            required
          />

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="Quantity (kg)"
            value={saleQtyInput}
            onChange={(e) => setSaleQtyInput(e.target.value)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className="border p-2 rounded w-full"
            required
          />

          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 md:col-span-1 col-span-2"
          >
            Add Sale
          </button>

          <div className="md:col-span-6 col-span-2 text-sm text-gray-600">
            Avg purchase for <span className="font-medium">{saleItem || "—"}</span>:{" "}
            <span className="font-semibold">
              {saleItem ? getAvgPurchase(saleItem).toFixed(2) : "0.00"}
            </span>
            {saleItem && getAvgPurchase(saleItem) === 0 && " (no purchase history found)"}
          </div>
        </div>
      </form>

      {/* Sales & Profit Table (now uses filteredSales) */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Avg Purchase Rate</th>
              <th className="p-2 text-left">Sale Rate</th>
              <th className="p-2 text-left">Quantity (kg)</th>
              <th className="p-2 text-left">Profit</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length ? (
              filteredSales.map((s) => {
                const avgPurchase = getAvgPurchase(s.item_name);
                const profit = (s.sale_rate - avgPurchase) * s.quantity_kg;
                return (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{s.item_name}</td>
                    <td className="p-2">{avgPurchase.toFixed(2)}</td>
                    <td className="p-2">{s.sale_rate}</td>
                    <td className="p-2">{s.quantity_kg.toFixed(2)}</td>
                    <td
                      className={`p-2 font-semibold ${
                        profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {profit.toFixed(2)}
                    </td>
                    <td className="p-2">{s.sale_date}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeleteSale(s.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="p-3 text-gray-500" colSpan={7}>
                  No sales match the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Sales total profit for FILTERED rows */}
        <div className="text-right mt-3 font-bold text-lg">
          Sales Total Profit (filtered):{" "}
          <span className="text-emerald-600">{totalProfit.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}


/* -------- Profits: generate + view stored rows from /profit_reports -------- */
function ProfitPanel() {
  const API = 'http://127.0.0.1:8000';
  const API_KEY = '@uzair143';

  const today = new Date();
  const minusDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  const [granularity, setGranularity] =
    useState<'daily'|'weekly'|'monthly'|'custom'>('daily');
  const [startDate, setStartDate] = useState(minusDays(30));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));

  const [rows, setRows] = useState<
    { id:number; granularity:string; bucket_key:string; start_date:string; end_date:string; total_profit:number; created_at:string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const fetchProfits = async () => {
    setErr(null);
    const url = new URL(`${API}/profits`);
    url.searchParams.set('granularity', granularity);
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);

    const resp = await fetch(url.toString(), {
      headers: { 'X-API-Key': API_KEY },
      cache: 'no-store',
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`${resp.status} ${resp.statusText}: ${t}`);
    }
    const data = await resp.json();
    setRows(data.profits || []);
  };

  const generateProfits = async () => {
    const resp = await fetch(`${API}/profits/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ start_date: startDate, end_date: endDate, granularity }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`${resp.status} ${resp.statusText}: ${t}`);
    }
  };

  // 🔁 Single refresh function used by effects & buttons
  const refreshCurrent = async (auto = false) => {
    setLoading(true);
    setErr(null);
    try {
      // For CUSTOM ranges we always generate to ensure a row exists for this exact range,
      // then fetch the freshly stored rows.
      if (granularity === 'custom') {
        await generateProfits();
      }
      await fetchProfits();
    } catch (e: any) {
      setErr(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh whenever filters change (fixes custom not updating)
  useEffect(() => {
    refreshCurrent(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity, startDate, endDate]);

  const onClickGenerate = async () => {
    setLoading(true);
    setErr(null);
    try {
      await generateProfits();
      await fetchProfits();
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onClickRefresh = async () => {
    await refreshCurrent();
  };

  const grandTotal = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.total_profit) || 0), 0),
    [rows]
  );

  return (
    <div className="overflow-x-auto mt-10">
      <h2 className="text-2xl font-semibold mb-3">📈 Profit Reports</h2>

      {/* Controls */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
          {/* Granularity */}
          <div className="md:col-span-2 col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Granularity</label>
            <div className="flex gap-2">
              {(['daily','weekly','monthly','custom'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-2 rounded border ${
                    granularity === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800'
                  }`}
                >
                  {g[0].toUpperCase()+g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Start */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* End */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClickGenerate}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? 'Working…' : 'Generate + Save'}
            </button>

            <button
              type="button"
              onClick={onClickRefresh}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {err && <p className="text-red-600 mt-3">{err}</p>}
      </div>

      {/* Table */}
      <table className="w-full border border-gray-300 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Period</th>
            <th className="p-2 text-left">Start</th>
            <th className="p-2 text-left">End</th>
            <th className="p-2 text-left">Total Profit</th>
            <th className="p-2 text-left">Saved</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.bucket_key}</td>
                <td className="p-2">{r.start_date}</td>
                <td className="p-2">{r.end_date}</td>
                <td className={`p-2 font-semibold ${Number(r.total_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(r.total_profit).toFixed(2)}
                </td>
                <td className="p-2 text-sm text-gray-600">{r.created_at}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-3 text-gray-500" colSpan={5}>
                No rows yet for this filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Grand total */}
      <div className="text-right mt-3 font-bold text-lg">
        Total (shown rows): <span className="text-emerald-600">{grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
