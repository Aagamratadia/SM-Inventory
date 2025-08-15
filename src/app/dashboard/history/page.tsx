'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface AssignmentRow {
  itemId: string;
  itemName: string;
  category: string;
  vendorname?: string;
  action: 'assigned' | 'returned';
  quantity: number;
  assignedAt?: string;
  returnedAt?: string;
  user?: { _id: string; name: string } | null;
  performedBy?: { _id: string; name: string } | null;
}

export default function AssignmentLogPage() {
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // filter state
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [userId, setUserId] = useState('');
  const [performedBy, setPerformedBy] = useState('');

  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [items, setItems] = useState<{ name: string; category: string }[]>([]);

  const fetchUsersAndItems = async () => {
    try {
      const [u, i] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/items'),
      ]);
      if (u.ok) {
        const ud = await u.json();
        setUsers((ud || []).map((x: any) => ({ _id: x._id, name: x.name })));
      }
      if (i.ok) {
        const id = await i.json();
        setItems((id || []).map((x: any) => ({ name: x.name, category: x.category })));
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const sp = new URLSearchParams();
      if (itemName) sp.set('itemName', itemName);
      if (category) sp.set('category', category);
      if (userId) sp.set('userId', userId);
      if (performedBy) sp.set('performedBy', performedBy);

      const res = await fetch(`/api/assignments?${sp.toString()}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to fetch assignment history');
      }
      const data = await res.json();
      setRows(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch assignment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndItems();
  }, []);

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemName, category, userId, performedBy]);

  const itemNames = useMemo(() => Array.from(new Set(items.map((x) => x.name))).sort(), [items]);
  const categories = useMemo(() => Array.from(new Set(items.map((x) => x.category))).sort(), [items]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Assignment History</h1>
        <a href="/dashboard" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-gray-700">Back to Inventory</a>
      </div>
      <p className="text-sm text-gray-600 mb-6">View who assigned items to whom, with quantities and dates. Use filters to narrow results.</p>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Item</label>
          <input list="itemNames" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="All" className="w-full px-3 py-2 border rounded-md" />
          <datalist id="itemNames">
            {itemNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Category</label>
          <input list="categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="All" className="w-full px-3 py-2 border rounded-md" />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Assigned To</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full px-3 py-2 border rounded-md">
            <option value="">All</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Assigned By</label>
          <select value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} className="w-full px-3 py-2 border rounded-md">
            <option value="">All</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex justify-end">
          <button
            onClick={() => { setItemName(''); setCategory(''); setUserId(''); setPerformedBy(''); }}
            className="px-4 py-2 text-sm bg-green-100 hover:bg-gray-200 rounded border"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      {!loading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-[1000px] w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((r, idx) => {
                const dateStr = r.action === 'assigned' ? r.assignedAt : r.returnedAt;
                const dateFmt = dateStr ? new Date(dateStr).toLocaleString() : '—';
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.category || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.vendorname || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.user?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.performedBy?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {r.action === 'assigned' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Assigned</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Returned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{dateFmt}</td>
                  </tr>
                );
              })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
