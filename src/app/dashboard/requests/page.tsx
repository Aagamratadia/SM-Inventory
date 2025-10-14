'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

interface RequestItem {
  itemId: string;
  itemName: string;
  category?: string;
  qty: number;
}

interface RequestDoc {
  _id: string;
  requesterId: string;
  status: RequestStatus;
  items: RequestItem[];
  note?: string;
  submittedAt: string;
  decisionAt?: string;
  decisionBy?: string;
  decisionNote?: string;
}

export default function MyRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestDoc[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests?mine=true');
      if (!res.ok) throw new Error('Failed to load requests');
      const data: RequestDoc[] = await res.json();
      setRequests(data);
    } catch (e: any) {
      setError(e.message || 'Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="px-8 pt-4 pb-8 min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>My Requests</h1>
          <p className="mt-1 text-sm" style={{ color: '#4B5563' }}>Track status and decisions.</p>
        </div>
        <Link href="/dashboard/requests/new" className="px-4 py-2 text-white rounded-md" style={{ backgroundColor: '#6366F1' }}>New Request</Link>
      </div>

      {requests.length === 0 ? (
        <div className="p-6 bg-white rounded border" style={{ borderColor: '#E5E7EB' }}>
          No requests yet.
        </div>
      ) : (
        <div className="shadow-md rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Submitted</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Items</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#E5E7EB' }}>
                {requests.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: '#111827' }}>{new Date(r.submittedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#111827' }}>
                      <ul className="list-disc ml-5">
                        {r.items.map((it) => (
                          <li key={String(it.itemId)}>{it.itemName} ({it.qty})</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full" style={{ backgroundColor: r.status === 'Approved' ? '#D1FAE5' : r.status === 'Rejected' ? '#FEE2E2' : '#DBEAFE', color: '#111827' }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#111827' }}>
                      {r.status === 'Approved' && (
                        <div>Approved on {r.decisionAt ? new Date(r.decisionAt).toLocaleString() : ''}</div>
                      )}
                      {r.status === 'Rejected' && (
                        <div>
                          <div>Rejected on {r.decisionAt ? new Date(r.decisionAt).toLocaleString() : ''}</div>
                          {r.decisionNote && (
                            <div className="mt-1 p-2 rounded text-xs" style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                              Reason: {r.decisionNote}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
