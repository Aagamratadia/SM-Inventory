'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IItem } from '@/models/Item';
import { Box, Package, DollarSign, User, Calendar, Tag, ClipboardList, ArrowLeft, Building2, Phone, Mail, MapPin } from 'lucide-react';

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
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-md border hover:bg-gray-50 transition-colors"
          style={{ color: '#4B5563', borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
        >
          <ArrowLeft size={18} />
          Back to Inventory
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-6 md:p-8" style={{ backgroundColor: '#FFFFFF', color: '#111827' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
                <Package size={32} className="text-gray-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>{item.name}</h1>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Item Details Card */}
            <div className="p-6 rounded-xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
                <ClipboardList size={20} />
                Item Details
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Price</p>
                    <p className="text-lg font-semibold" style={{ color: '#111827' }}>
                      {item.price ? `₹${item.price.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg border" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
                    <p className="text-xs" style={{ color: '#4B5563' }}>Available</p>
                    <p className="text-xl font-bold" style={{ color: '#111827' }}>{item.quantity ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-lg border" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
                    <p className="text-xs" style={{ color: '#4B5563' }}>Assigned</p>
                    <p className="text-xl font-bold" style={{ color: '#111827' }}>{Math.max((item.totalQuantity || 0) - (item.quantity || 0), 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg border" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
                    <p className="text-xs" style={{ color: '#4B5563' }}>Total Added</p>
                    <p className="text-xl font-bold" style={{ color: '#111827' }}>{item.totalQuantity ?? 0}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Status</p>
                    <div className="mt-1">
                      {item.assignedTo ? (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full w-fit" style={{ backgroundColor: '#F9FAFB', color: '#4B5563' }}>
                          Assigned
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full w-fit" style={{ backgroundColor: '#F9FAFB', color: '#4B5563' }}>
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {item.assignedTo && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Assigned To</p>
                      <p className="text-lg font-medium" style={{ color: '#111827' }}>
                        {(item.assignedTo as any).name}
                      </p>
                    </div>
                  </div>
                )}

                {item.notes && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Notes</p>
                      <p className="mt-1" style={{ color: '#111827' }}>{item.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vendor Information Card */}
            <div className="p-6 rounded-xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Building2 size={20} />
                Vendor Information
              </h2>
              {item.vendorname ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Vendor Name</p>
                      <p className="text-lg font-medium" style={{ color: '#111827' }}>{item.vendorname}</p>
                    </div>
                  </div>

                  {item.vendorContact && (
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Contact</p>
                        <a href={`tel:${item.vendorContact}`} className="hover:underline" style={{ color: '#4B5563' }}>
                          {item.vendorContact}
                        </a>
                      </div>
                    </div>
                  )}

                  {item.vendorEmail && (
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Email</p>
                        <a href={`mailto:${item.vendorEmail}`} className="hover:underline break-all" style={{ color: '#4B5563' }}>
                          {item.vendorEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {item.vendorAddress && (
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Address</p>
                        <p style={{ color: '#111827' }}>{item.vendorAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No vendor information available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#111827' }}>
              <Package size={24} className="text-gray-600" />
              <span>Stock Additions</span>
            </h2>
            <div className="space-y-4">
              {item.stockAdditions && item.stockAdditions.length > 0 ? (
                [...item.stockAdditions]
                  .sort((a: any, b: any) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
                  .map((entry: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg border" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-sm" style={{ color: '#4B5563' }}>Added By</p>
                            <p className="font-semibold" style={{ color: '#111827' }}>{entry.performedBy?.name || 'System'}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm" style={{ color: '#4B5563' }}>Quantity</p>
                              <p className="font-semibold" style={{ color: '#111827' }}>{entry.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm" style={{ color: '#4B5563' }}>Date</p>
                              <p className="font-semibold" style={{ color: '#111827' }}>{new Date(entry.addedAt).toLocaleString()}</p>
                            </div>
                            {typeof entry.priceAtAddition === 'number' && (
                              <div className="text-right">
                                <p className="text-sm" style={{ color: '#4B5563' }}>Price</p>
                                <p className="font-semibold" style={{ color: '#111827' }}>₹{Number(entry.priceAtAddition).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {entry.note && (
                          <div className="text-sm" style={{ color: '#4B5563' }}>
                            <span className="font-medium" style={{ color: '#111827' }}>Note:</span> {entry.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>No stock additions found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#111827' }}>
              <Calendar size={24} className="text-gray-600" />
              <span>Assignment History</span>
            </h2>
            <div className="space-y-6">
              {item.assignmentHistory && item.assignmentHistory.length > 0 ? (
                [...item.assignmentHistory]
                  .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
                  .map((assignment, index) => (
                  <div key={index} className="p-5 rounded-lg border transition-colors" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-3 sm:mb-0">
                        <p className="font-semibold flex items-center gap-2" style={{ color: '#111827' }}>
                          <User size={16} className="text-gray-500" />
                          <span>{(assignment as any).user?.name || 'Unknown User'}</span>
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#4B5563' }}>
                          {new Date(assignment.assignedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm" style={{ color: '#4B5563' }}>Action</p>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: '#F9FAFB', color: '#4B5563' }}>
                            {assignment.action.charAt(0).toUpperCase() + assignment.action.slice(1)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm" style={{ color: '#4B5563' }}>Quantity</p>
                          <p className="font-semibold" style={{ color: '#111827' }}>{assignment.quantity}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>No assignment history found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
