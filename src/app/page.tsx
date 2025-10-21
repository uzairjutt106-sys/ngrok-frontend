'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Transaction {
  id: number;
  item_name: string;
  purchase_rate: number;
  sale_rate: number;
  quantity_kg: number;
  transaction_date: string;
}

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const [itemName, setItemName] = useState('');
  const [purchaseRate, setPurchaseRate] = useState('');
  const [saleRate, setSaleRate] = useState('');
  const [quantity, setQuantity] = useState('');

  const [filterItem, setFilterItem] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // --- Fetch all transactions ---
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/transactions', {
        headers: { 'X-API-Key': '@uzair143' },
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

  // --- Add new transaction ---
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '@uzair143',
        },
        body: JSON.stringify({
          item_name: itemName,
          purchase_rate: parseFloat(purchaseRate),
          sale_rate: parseFloat(saleRate),
          quantity_kg: parseFloat(quantity),
        }),
      });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      await fetchTransactions();
      setItemName('');
      setPurchaseRate('');
      setSaleRate('');
      setQuantity('');
    } catch (err: any) {
      alert('Failed to add transaction: ' + err.message);
    }
  };

  // --- Delete transaction ---
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

  // --- Filter transactions by item and date ---
  const filteredTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date);
    const matchesItem =
      filterItem === '' ||
      t.item_name.toLowerCase().includes(filterItem.toLowerCase());
    const matchesFrom = !fromDate || date >= new Date(fromDate);
    const matchesTo = !toDate || date <= new Date(toDate);
    return matchesItem && matchesFrom && matchesTo;
  });

  // --- Calculate total and daily profits ---
  const totalProfit = filteredTransactions.reduce(
    (sum, t) => sum + (t.sale_rate - t.purchase_rate) * t.quantity_kg,
    0
  );

  const dailySummary = Object.values(
    filteredTransactions.reduce((acc: any, t) => {
      const day = t.transaction_date.split('T')[0];
      const profit = (t.sale_rate - t.purchase_rate) * t.quantity_kg;
      if (!acc[day])
        acc[day] = { date: day, totalSales: 0, totalPurchase: 0, totalProfit: 0 };
      acc[day].totalSales += t.sale_rate * t.quantity_kg;
      acc[day].totalPurchase += t.purchase_rate * t.quantity_kg;
      acc[day].totalProfit += profit;
      return acc;
    }, {})
  );

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error)
    return <p className="text-center mt-10 text-red-500">Error: {error}</p>;

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

      <h1 className="text-3xl font-bold mb-6 text-center">
        📦 Scrapit
      </h1>

      {/* Add transaction form */}
      <form
        onSubmit={handleAdd}
        className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-8 shadow-sm"
      >
        <h2 className="text-xl font-semibold mb-3">Add Transaction</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder="Item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Purchase rate"
            value={purchaseRate}
            onChange={(e) => setPurchaseRate(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Sale rate"
            value={saleRate}
            onChange={(e) => setSaleRate(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Quantity (kg)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
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

      {/* Filter options */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Filter Transactions</h2>
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

      {/* Transactions Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Purchase Rate</th>
              <th className="p-2 text-left">Sale Rate</th>
              <th className="p-2 text-left">Quantity (kg)</th>
              <th className="p-2 text-left">Profit</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => {
              const profit = (t.sale_rate - t.purchase_rate) * t.quantity_kg;
              return (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.item_name}</td>
                  <td className="p-2">{t.purchase_rate}</td>
                  <td className="p-2">{t.sale_rate}</td>
                  <td className="p-2">{t.quantity_kg}</td>
                  <td className="p-2 text-green-600 font-semibold">
                    {profit.toFixed(2)}
                  </td>
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
          </tbody>
        </table>
        {/* Total Profit */}
        <div className="text-right mt-3 font-bold text-lg">
          Total Profit: <span className="text-green-600">{totalProfit.toFixed(2)}</span>
        </div>
      </div>

      {/* Daily Summary Table */}
      <div className="overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-3">📅 Daily Summary</h2>
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Total Sales</th>
              <th className="p-2 text-left">Total Purchase</th>
              <th className="p-2 text-left">Total Profit</th>
            </tr>
          </thead>
          <tbody>
            {dailySummary.map((day: any) => (
              <tr key={day.date} className="border-t">
                <td className="p-2">{day.date}</td>
                <td className="p-2">{day.totalSales.toFixed(2)}</td>
                <td className="p-2">{day.totalPurchase.toFixed(2)}</td>
                <td className="p-2 text-green-600 font-semibold">
                  {day.totalProfit.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
