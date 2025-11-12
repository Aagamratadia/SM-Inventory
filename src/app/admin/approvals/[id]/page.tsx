'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ApprovalDialog from '@/components/ui/ApprovalDialog';

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
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const load = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    const run = async () => {
      await load();
    };
    void run();
  }, [load]);

  const approve = async () => {
    if (!reqDoc) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/requests/${reqDoc._id}/approve`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to approve');
      await load();
      setShowApprovalDialog(true);
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
  const requesterName = typeof reqDoc.requesterId === 'object' ? reqDoc.requesterId.name : 'Unknown';
  
  // Determine request title based on items
  const categories = Array.from(new Set(reqDoc.items.map(i => i.category).filter(Boolean)));
  const requestTitle = categories.length === 1 ? `Request for ${categories[0]}` : 
                       categories.length > 1 ? `Request for Multiple Categories` : 
                       'Item Request';

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Approval Dialog */}
      <ApprovalDialog
        isOpen={showApprovalDialog}
        onClose={() => setShowApprovalDialog(false)}
        onGoToWarehouse={() => router.push('/warehouse')}
        onBackToQueue={() => router.push('/admin/approvals')}
      />

      {/* Header with Back Button */}
      <div className="mb-6">
        <Link href="/admin/approvals" className="inline-flex items-center px-4 py-2 text-sm rounded-md border mb-4 hover:bg-gray-50 transition" style={{ borderColor: '#E5E7EB', color: '#4B5563' }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Approvals
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>{requestTitle}</h1>
          <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: reqDoc.status === 'Pending' ? '#FEF3C7' : reqDoc.status === 'Approved' ? '#D1FAE5' : '#FEE2E2', color: '#111827' }}>
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
                  <th className="py-2 font-semibold" style={{ color: '#6366F1' }}>Name</th>
                  <th className="py-2 font-semibold" style={{ color: '#6366F1' }}>Category</th>
                  <th className="py-2 font-semibold" style={{ color: '#6366F1' }}>Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#E5E7EB' }}>
                {reqDoc.items.map((it) => (
                  <tr key={it.itemId} className="hover:bg-gray-50">
                    <td className="py-3 font-medium" style={{ color: '#111827' }}>{it.itemName}</td>
                    <td className="py-3" style={{ color: '#6B7280' }}>{it.category || '—'}</td>
                    <td className="py-3 font-bold" style={{ color: '#6366F1' }}>{it.qty}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2" style={{ borderColor: '#6366F1' }}>
                <tr>
                  <td className="pt-3 text-sm font-bold" style={{ color: '#111827' }} colSpan={2}>Total Quantity</td>
                  <td className="pt-3 text-sm font-bold" style={{ color: '#6366F1' }}>{totalQty}</td>
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
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: '#6366F1', borderTop: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold" style={{ color: '#111827' }}>Decision Panel</span>
              <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: reqDoc.status === 'Pending' ? '#FEF3C7' : reqDoc.status === 'Approved' ? '#D1FAE5' : '#FEE2E2', color: '#111827' }}>{reqDoc.status}</span>
            </div>
            {reqDoc.status === 'Pending' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Reject reason (optional)</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ borderColor: '#E5E7EB' }}
                    placeholder="Provide a reason for rejection..."
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={approve}
                    disabled={submitting}
                    className="w-full px-4 py-3 text-white rounded-md font-medium transition-all hover:shadow-lg disabled:opacity-50"
                    style={{ background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                  >
                    {submitting ? 'Processing…' : '✓ Approve Request'}
                  </button>
                  <button
                    onClick={reject}
                    disabled={submitting}
                    className="w-full px-4 py-3 text-white rounded-md font-medium transition-all hover:shadow-lg disabled:opacity-50"
                    style={{ background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #EF4444, #F97316)' }}
                  >
                    {submitting ? 'Processing…' : '✗ Reject Request'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-md text-center" style={{ backgroundColor: '#F3F4F6' }}>
                <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                  This request has been {reqDoc.status.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
