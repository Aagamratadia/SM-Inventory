'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

interface RequestItem {
  itemId: string;
  itemName: string;
  category?: string;
  qty: number;
}

interface Requester {
  _id: string;
  name: string;
  email: string;
}

interface RequestDoc {
  _id: string;
  requesterId: string | Requester;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';
  items: RequestItem[];
  note?: string;
  submittedAt: string;
  decisionAt?: string;
  decisionBy?: string;
  decisionNote?: string;
}

export default function WarehouseQueuePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestDoc[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/warehouse/requests?fulfilled=false');
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
      r.items.some(i => i.itemName.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)) ||
      (r.note || '').toLowerCase().includes(q) ||
      r._id.toLowerCase().includes(q)
    );
  }, [requests, search]);

  if (loading) return <div className="p-6">Loading warehouse queue…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center px-4 py-2 text-sm rounded-md border mb-4 hover:bg-gray-50 transition" style={{ borderColor: '#E5E7EB', color: '#4B5563' }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>Warehouse Queue</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>Approved requests ready for fulfillment</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item, requester, or note..."
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
        />
      </div>

      {/* Request Cards */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
            <p className="text-sm font-medium">No approved requests to fulfill.</p>
          </div>
        )}

        {filtered.map((req) => {
          const totalQty = req.items.reduce((a, b) => a + Number(b.qty || 0), 0);
          const requesterName = typeof req.requesterId === 'object' ? req.requesterId.name : 'Unknown';
          const itemsList = req.items.map(i => i.itemName).join(', ');
          
          return (
            <Link key={req._id} href={`/warehouse/${req._id}`}>
              <div 
                className="p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 cursor-pointer text-left w-full"
                style={{ 
                  borderLeftColor: '#6366F1',
                  borderTop: '1px solid #E5E7EB',
                  borderRight: '1px solid #E5E7EB',
                  borderBottom: '1px solid #E5E7EB',
                  background: 'linear-gradient(to right, rgba(99,102,241,0.03), #FFFFFF 10%)'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: '#111827' }}>
                        {requesterName}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                        Approved
                      </span>
                    </div>
                    <div className="text-xs font-medium" style={{ color: '#6366F1' }}>
                      Request #{req._id.slice(-6).toUpperCase()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="text-xs font-semibold mr-2" style={{ color: '#6B7280' }}>Items:</span>
                    <span className="text-xs flex-1" style={{ color: '#374151' }}>{itemsList}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold mr-2" style={{ color: '#6B7280' }}>Quantity:</span>
                    <span className="text-xs font-bold" style={{ color: '#6366F1' }}>{totalQty} units</span>
                  </div>
                </div>

                {req.note && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                    <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Note: </span>
                    <span className="text-xs" style={{ color: '#374151' }}>{req.note}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
