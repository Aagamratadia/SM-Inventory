'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { IItem } from '@/models/Item';

// Helper to compute totals and consistency
function computeTotals(item: any) {
  const available = Number(item?.quantity ?? 0);
  let total: number | undefined = item?.totalQuantity;
  let isConsistent = false;
  const unitPrice = Number(item?.price ?? 0);

  const hist = Array.isArray(item?.assignmentHistory) ? item.assignmentHistory : [];
  const netAssignedFromHist = hist.reduce((acc: number, h: any) => {
    const q = Number(h?.quantity ?? 1);
    if (h?.action === 'assigned') return acc + (Number.isFinite(q) ? q : 1);
    if (h?.action === 'returned') return acc - (Number.isFinite(q) ? q : 1);
    return acc;
  }, 0);

  if (typeof total === 'number' && Number.isFinite(total)) {
    // If totalQuantity exists, check consistency against history
    const assigned = Math.max(total - available, 0);
    isConsistent = assigned === Math.max(netAssignedFromHist, 0);
  } else {
    // Fallback: infer total from history for legacy items
    total = available + Math.max(netAssignedFromHist, 0);
    isConsistent = true; // Inferred totals are always consistent by definition
  }

  const assigned = Math.max((total as number) - available, 0);
  const valueAvailable = Number.isFinite(unitPrice) ? available * unitPrice : undefined;
  return { available, assigned, total: total as number, isConsistent, unitPrice, valueAvailable };
}

export default function StockTrackerPage() {
  const [items, setItems] = useState<IItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fixerStatus, setFixerStatus] = useState({ message: '', loading: false });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Failed to fetch items');
      const data = await res.json();
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleFixTotals = async () => {
    setFixerStatus({ message: '', loading: true });
    try {
      const res = await fetch('/api/items/fix-totals', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fix totals');
      setFixerStatus({ message: data.message, loading: false });
      fetchItems(); // Refresh data
    } catch (e: any) {
      setFixerStatus({ message: e.message, loading: false });
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((it) => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q));
  }, [items, search]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-6" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>Stock Tracker</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleFixTotals}
            disabled={fixerStatus.loading}
            className="px-4 py-2 text-white rounded-md transition-colors disabled:opacity-70"
            style={{ backgroundColor: '#6366F1' }}
          >
            {fixerStatus.loading ? 'Fixing...' : 'Fix Inconsistent Totals'}
          </button>
          <Link href="/dashboard" className="px-4 py-2 rounded-md border hover:bg-gray-50 transition-colors" style={{ color: '#4B5563', borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>Back to Inventory</Link>
        </div>
      </div>

      {fixerStatus.message && (
        <div className="p-4 mb-4 text-sm rounded-lg" style={{ backgroundColor: '#F9FAFB', color: fixerStatus.message.includes('Failed') ? '#DC2626' : '#4B5563' }}>
          {fixerStatus.message}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ borderColor: '#E5E7EB', color: '#111827', backgroundColor: '#FFFFFF' }}
        />
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-max min-w-[1100px] divide-y" style={{ borderColor: '#E5E7EB' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Available</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Total Added</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Total Value</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Consistency</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y" style={{ borderColor: '#E5E7EB' }}>
            {filtered.map((item: any) => {
              const { available, assigned, total, isConsistent, unitPrice, valueAvailable } = computeTotals(item);
              const fmtCurrency = (n: number | undefined) =>
                typeof n === 'number' && Number.isFinite(n)
                  ? n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
                  : '—';
              return (
                <tr key={item._id as string}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.vendorname || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtCurrency(unitPrice)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{available}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assigned}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtCurrency(valueAvailable)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isConsistent ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ backgroundColor: '#F9FAFB', color: '#4B5563' }}>
                        Consistent
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                        Inconsistent
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
