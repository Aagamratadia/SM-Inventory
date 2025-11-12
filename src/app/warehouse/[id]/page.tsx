'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface RequestItem { itemId: string; itemName: string; category?: string; qty: number }

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
  fulfilledAt?: string;
  fulfilledBy?: string;
  fulfillmentNote?: string;
}

export default function WarehouseDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reqDoc, setReqDoc] = useState<RequestDoc | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/warehouse/requests/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load');
      setReqDoc(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const totalQty = useMemo(() => reqDoc?.items.reduce((a, b) => a + Number(b.qty || 0), 0) || 0, [reqDoc]);

  const fulfill = async () => {
    if (!reqDoc) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/warehouse/requests/${reqDoc._id}/fulfill`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note ? { note } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to fulfill');
      await load();
      alert('Request marked as completed!');
      router.push('/dashboard');
    } catch (e: any) {
      alert(e.message || 'Failed to fulfill');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!reqDoc) return <div className="p-6">Not found</div>;

  const requesterName = typeof reqDoc.requesterId === 'object' ? reqDoc.requesterId.name : 'Unknown';
  
  // Determine request title based on items
  const categories = Array.from(new Set(reqDoc.items.map(i => i.category).filter(Boolean)));
  const requestTitle = categories.length === 1 ? `Request for ${categories[0]}` : 
                       categories.length > 1 ? `Request for Multiple Categories` : 
                       'Item Request';

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link href="/warehouse" className="inline-flex items-center px-4 py-2 text-sm rounded-md border mb-4 hover:bg-gray-50 transition" style={{ borderColor: '#E5E7EB', color: '#4B5563' }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Warehouse Queue
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>{requestTitle}</h1>
          <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: reqDoc.status === 'Approved' ? '#DBEAFE' : '#D1FAE5', color: '#111827' }}>
            {reqDoc.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: '#6B7280' }}>Requested by</span>
          <span className="font-semibold" style={{ color: '#6366F1' }}>{requesterName}</span>
          <span style={{ color: '#E5E7EB' }}>•</span>
          <span style={{ color: '#6B7280' }}>ID: #{reqDoc._id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: '#6366F1', borderTop: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
            <div className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#111827' }}>
              <span>Requested Items</span>
              <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
                {reqDoc.items.length} items
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b-2" style={{ borderColor: '#6366F1' }}>
                  <th className="py-2 font-semibold" style={{ color: '#6366F1' }}>Category</th>
                  <th className="py-2 font-semibold" style={{ color: '#6366F1' }}>Item</th>
                  <th className="py-2 font-semibold" style={{ color: '#6366F1' }}>Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#E5E7EB' }}>
                {reqDoc.items.map((it) => (
                  <tr key={it.itemId} className="hover:bg-gray-50">
                    <td className="py-3" style={{ color: '#6B7280' }}>{it.category || '—'}</td>
                    <td className="py-3 font-medium" style={{ color: '#111827' }}>{it.itemName}</td>
                    <td className="py-3 font-bold" style={{ color: '#6366F1' }}>{it.qty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2" style={{ borderColor: '#6366F1' }}>
                <tr>
                  <td colSpan={2} className="pt-3 text-sm font-bold" style={{ color: '#111827' }}>Total Quantity</td>
                  <td className="pt-3 text-sm font-bold" style={{ color: '#6366F1' }}>{totalQty}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {reqDoc.decisionNote && (
            <div className="bg-white p-4 rounded-lg shadow-sm border" style={{ borderColor: '#E5E7EB' }}>
              <div className="font-semibold mb-1" style={{ color: '#111827' }}>Admin Note</div>
              <div className="text-sm" style={{ color: '#374151' }}>{reqDoc.decisionNote}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: '#6366F1', borderTop: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold" style={{ color: '#111827' }}>Fulfillment Panel</span>
              <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: reqDoc.status === 'Approved' ? '#DBEAFE' : '#D1FAE5', color: '#111827' }}>{reqDoc.status}</span>
            </div>
            {reqDoc.status === 'Approved' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Fulfillment note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="Add any remarks for warehouse records..."
                  />
                </div>
                <button
                  onClick={fulfill}
                  disabled={submitting}
                  className="w-full px-4 py-3 text-white rounded-md font-medium transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  {submitting ? 'Processing…' : '✓ Mark as Completed'}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-md text-center" style={{ backgroundColor: '#F3F4F6' }}>
                <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                  {reqDoc.status === 'Completed' ? 'This request has been completed.' : 'Not yet approved'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
