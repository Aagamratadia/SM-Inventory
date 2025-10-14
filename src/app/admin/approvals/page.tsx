'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface RequestItem {
  itemId: string;
  itemName: string;
  category?: string;
  qty: number;
}

interface RequestDoc {
  _id: string;
  requesterId: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  items: RequestItem[];
  note?: string;
  submittedAt: string;
}

export default function ApprovalsQueuePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestDoc[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/requests?status=Pending');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load requests');
        setRequests(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(r =>
      r.items.some(i => i.itemName.toLowerCase().includes(q)) ||
      (r.note || '').toLowerCase().includes(q) ||
      r._id.toLowerCase().includes(q)
    );
  }, [requests, search]);

  if (loading) return <div className="p-6">Loading approvals…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Approvals Queue</h1>
          <p className="text-sm" style={{ color: '#4B5563' }}>Pending requests. Click to review and approve/reject.</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item, note or request id"
          className="w-full px-3 py-2 border rounded-md"
          style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="p-4 rounded-md" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
            No pending requests.
          </div>
        )}

        {filtered.map((req) => {
          const totalLines = req.items.length;
          const totalQty = req.items.reduce((a, b) => a + Number(b.qty || 0), 0);
          return (
            <Link key={req._id} href={`/admin/approvals/${req._id}`} className="block">
              <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#111827' }}>Request {req._id.slice(-6)}</div>
                    <div className="text-xs" style={{ color: '#6B7280' }}>{new Date(req.submittedAt).toLocaleString()}</div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>Pending</span>
                </div>
                <div className="mt-2 text-sm" style={{ color: '#374151' }}>
                  {totalLines} line(s), total qty {totalQty}
                </div>
                {req.note && (
                  <div className="mt-1 text-xs" style={{ color: '#6B7280' }}>Note: {req.note}</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
