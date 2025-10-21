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
  date: string; // YYYY-MM-DD
}

export default function HomePage() {
  // -------------------- Purchases (Transactions) --------------------
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Add-purchase form (no sale rate here)
  const [itemName, setItemName] = useState('');
  const [purchaseRate, setPurchaseRate] = useState('');
  const [quantity, setQuantity] = useState('');

  // Filters for transactions
  const [filterItem, setFilterItem] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/transactions', {
        headers: { 'X-API-Key': '@uzair143' },
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
    if ([pr, q].some((n) => Number.isNaN(n) || n <= 0)) {
      alert('Please enter valid purchase rate and quantity (> 0).');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '@uzair143',
        },
        body: JSON.stringify({
          item_name: itemName,
          purchase_rate: pr,
          quantity_kg: q,
        }),
      });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      await fetchTransactions();
      setItemName('');
      setPurchaseRate('');
      setQuantity('');
    } catch (err: any) {
      alert('Failed to add transaction: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': '@uzair143' },
      });
      if (!response.ok) throw new Error(`Failed to delete (status ${response.status})`);
      await fetchTransactions();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
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

  // Daily PURCHASE summary (no sales here)
  const dailyPurchaseSummary = useMemo(() => {
    const map: Record<
      string,
      { date: string; totalPurchaseAmount: number; totalQty: number; avgPurchaseRate: number }
    > = {};
    for (const t of filteredTransactions) {
      const day = t.transaction_date.split('T')[0];
      if (!map[day]) {
        map[day] = { date: day, totalPurchaseAmount: 0, totalQty: 0, avgPurchaseRate: 0 };
      }
      map[day].totalPurchaseAmount += t.purchase_rate * t.quantity_kg;
      map[day].totalQty += t.quantity_kg;
    }
    for (const d of Object.values(map)) {
      d.avgPurchaseRate = d.totalQty > 0 ? d.totalPurchaseAmount / d.totalQty : 0;
    }
    // most recent first
    return Object.values(map).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filteredTransactions]);

  // -------------------- Sales & Profit (Separate) --------------------
  // Local-only sales list (can be moved to API later)
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [saleItem, setSaleItem] = useState('');
  const [saleRateInput, setSaleRateInput] = useState('');
  const [saleQtyInput, setSaleQtyInput] = useState('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Weighted-average purchase rate per item (built from all transactions)
  const avgPurchaseByItem = useMemo(() => {
    const agg = new Map<string, { qty: number; cost: number }>();
    for (const t of transactions) {
      const key = t.item_name.trim().toLowerCase();
      const cost = t.purchase_rate * t.quantity_kg;
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

  const handleAddSale = (e: FormEvent) => {
    e.preventDefault();
    const sr = Number(saleRateInput);
    const q = Number(saleQtyInput);
    if (!saleItem.trim()) return alert('Enter item name');
    if ([sr, q].some((n) => Number.isNaN(n) || n <= 0)) {
      alert('Enter valid sale rate and quantity (> 0)');
      return;
    }
    const newEntry: SaleEntry = {
      id: Date.now(),
      item_name: saleItem.trim(),
      sale_rate: sr,
      quantity_kg: q,
      date: saleDate || new Date().toISOString().slice(0, 10),
    };
    setSales((prev) => [newEntry, ...prev]);
    setSaleItem('');
    setSaleRateInput('');
    setSaleQtyInput('');
  };

  const handleDeleteSale = (id: number) =>
    setSales((prev) => prev.filter((s) => s.id !== id));

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="Purchase rate"
            value={purchaseRate}
            onChange={(e) => setPurchaseRate(e.target.value)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            className="border p-2 rounded w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            autoComplete="off"
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
            onClick={fetchTransactions}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Purchases Table (no sale/profit columns) */}
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
              const amount = t.purchase_rate * t.quantity_kg;
              return (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.item_name}</td>
                  <td className="p-2">{t.purchase_rate.toFixed(2)}</td>
                  <td className="p-2">{t.quantity_kg.toFixed(2)}</td>
                  <td className="p-2">{amount.toFixed(2)}</td>
                  <td className="p-2">{t.transaction_date.split('T')[0]}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
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
              .reduce((sum, t) => sum + t.purchase_rate * t.quantity_kg, 0)
              .toFixed(2)}
          </span>
        </div>
      </div>

      {/* Daily Purchase Summary */}
      <div className="overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-3">📅 Daily Purchase Summary</h2>
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Total Qty (kg)</th>
              <th className="p-2 text-left">Total Purchase Amount</th>
              <th className="p-2 text-left">Avg Purchase Rate</th>
            </tr>
          </thead>
          <tbody>
            {dailyPurchaseSummary.map((day) => (
              <tr key={day.date} className="border-t">
                <td className="p-2">{day.date}</td>
                <td className="p-2">{day.totalQty.toFixed(2)}</td>
                <td className="p-2">{day.totalPurchaseAmount.toFixed(2)}</td>
                <td className="p-2">{day.avgPurchaseRate.toFixed(2)}</td>
              </tr>
            ))}
            {dailyPurchaseSummary.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>
                  No purchases to summarize.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- Sales & Profit (Separate Table) -------------------- */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-3">💰 Sales & Profit (Computed)</h2>

        {/* Add a Sale Entry */}
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
              list="items-list" // re-use the same datalist
              required
            />

            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="Sale rate"
              value={saleRateInput}
              onChange={(e) => setSaleRateInput(e.target.value)}
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

            {/* Context hint */}
            <div className="md:col-span-6 col-span-2 text-sm text-gray-600">
              Avg purchase for <span className="font-medium">{saleItem || '—'}</span>:{' '}
              <span className="font-semibold">
                {saleItem ? getAvgPurchase(saleItem).toFixed(2) : '0.00'}
              </span>
              {saleItem && getAvgPurchase(saleItem) === 0 && ' (no purchase history found)'}
            </div>
          </div>
        </form>

        {/* Sales & Profit Table */}
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
              {sales.map((s) => {
                const avgPurchase = getAvgPurchase(s.item_name);
                const profit = (s.sale_rate - avgPurchase) * s.quantity_kg;
                return (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{s.item_name}</td>
                    <td className="p-2">{avgPurchase.toFixed(2)}</td>
                    <td className="p-2">{s.sale_rate.toFixed(2)}</td>
                    <td className="p-2">{s.quantity_kg.toFixed(2)}</td>
                    <td
                      className={`p-2 font-semibold ${
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {profit.toFixed(2)}
                    </td>
                    <td className="p-2">{s.date}</td>
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
              })}
              {sales.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={7}>
                    No sales added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Sales total profit */}
          <div className="text-right mt-3 font-bold text-lg">
            Sales Total Profit:{' '}
            <span className="text-emerald-600">
              {sales
                .reduce((sum, s) => {
                  const avgPurchase = getAvgPurchase(s.item_name);
                  return sum + (s.sale_rate - avgPurchase) * s.quantity_kg;
                }, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

