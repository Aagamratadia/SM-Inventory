'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  decisionAt?: string;
  decisionBy?: string;
  decisionNote?: string;
}

export default function ApprovalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reqDoc, setReqDoc] = useState<RequestDoc | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/requests/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load');
      setReqDoc(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const approve = async () => {
    if (!reqDoc) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/requests/${reqDoc._id}/approve`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to approve');
      await load();
      alert('Approved');
      router.push('/admin/approvals');
    } catch (e: any) {
      alert(e.message || 'Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    if (!reqDoc) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/requests/${reqDoc._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rejectReason ? { reason: rejectReason } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to reject');
      await load();
      alert('Rejected');
      router.push('/admin/approvals');
    } catch (e: any) {
      alert(e.message || 'Failed to reject');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!reqDoc) return <div className="p-6">Not found</div>;

  const totalQty = reqDoc.items.reduce((a, b) => a + Number(b.qty || 0), 0);

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Request {reqDoc._id.slice(-6)}</h1>
          <div className="text-xs" style={{ color: '#6B7280' }}>Submitted {new Date(reqDoc.submittedAt).toLocaleString()}</div>
        </div>
        <Link href="/admin/approvals" className="px-3 py-1.5 text-sm rounded-md border" style={{ borderColor: '#E5E7EB', color: '#374151', backgroundColor: '#FFFFFF' }}>Back to list</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border" style={{ borderColor: '#E5E7EB' }}>
            <div className="font-semibold mb-2" style={{ color: '#111827' }}>Items</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: '#4B5563' }}>
                  <th className="py-2">Name</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#E5E7EB' }}>
                {reqDoc.items.map((it) => (
                  <tr key={it.itemId}>
                    <td className="py-2" style={{ color: '#111827' }}>{it.itemName}</td>
                    <td className="py-2" style={{ color: '#374151' }}>{it.category || '—'}</td>
                    <td className="py-2" style={{ color: '#111827' }}>{it.qty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-2 text-sm font-medium" style={{ color: '#111827' }} colSpan={2}>Total</td>
                  <td className="pt-2 text-sm font-medium" style={{ color: '#111827' }}>{totalQty}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {reqDoc.note && (
            <div className="bg-white p-4 rounded-lg shadow-sm border" style={{ borderColor: '#E5E7EB' }}>
              <div className="font-semibold mb-1" style={{ color: '#111827' }}>Requester Note</div>
              <div className="text-sm" style={{ color: '#374151' }}>{reqDoc.note}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: '#111827' }}>Decision</span>
              <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: reqDoc.status === 'Pending' ? '#FEF3C7' : reqDoc.status === 'Approved' ? '#D1FAE5' : '#FEE2E2', color: '#111827' }}>{reqDoc.status}</span>
            </div>
            {reqDoc.status === 'Pending' ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Reject reason (optional)</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full p-2 border rounded"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="Write a reason to include in the notification"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={approve}
                    disabled={submitting}
                    className="px-4 py-2 text-white rounded-md"
                    style={{ background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #10B981, #34D399)' }}
                  >
                    {submitting ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    onClick={reject}
                    disabled={submitting}
                    className="px-4 py-2 text-white rounded-md"
                    style={{ background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #EF4444, #F97316)' }}
                  >
                    {submitting ? 'Working…' : 'Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm" style={{ color: '#374151' }}>
                This request is {reqDoc.status.toLowerCase()}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
