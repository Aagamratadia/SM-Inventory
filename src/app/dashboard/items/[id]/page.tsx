'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IItem } from '@/models/Item';

export default function ItemDetailPage() {
  const [item, setItem] = useState<IItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/items/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch item details');
        }
        const data = await res.json();
        setItem(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  if (!item) {
    return <div className="text-center mt-10">Item not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="mb-6 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
        &larr; Back to Inventory
      </button>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-gray-800">{item.name}</h1>
          <p className="text-lg text-gray-500">Item ID: {item.itemId}</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Price</dt>
                <dd className="mt-1 text-lg text-gray-900">{item.price ? `₹${item.price.toLocaleString()}` : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  {item.assignedTo ? (
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">Assigned</span>
                  ) : (
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                  )}
                </dd>
              </div>
              {item.assignedTo && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                  <dd className="mt-1 text-lg text-gray-900">{(item.assignedTo as any).name}</dd>
                </div>
              )}
              {item.notes && (
                 <div>
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-lg text-gray-900">{item.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="p-6 border-t">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Assignment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {item.assignmentHistory && item.assignmentHistory.length > 0 ? (
                  item.assignmentHistory.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(entry.user as any)?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.action === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.quantity ?? 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.assignedAt || entry.returnedAt!).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No assignment history for this item.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
