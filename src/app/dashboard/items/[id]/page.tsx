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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="mb-6 px-4 py-2 flex items-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-600 transition-all duration-300"
        >
          <ArrowLeft size={18} />
          Back to Inventory
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Package size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{item.name}</h1>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Item Details Card */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
                <ClipboardList size={20} />
                Item Details
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {item.price ? `₹${item.price.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="mt-1">
                      {item.assignedTo ? (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                          Assigned
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {item.assignedTo && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assigned To</p>
                      <p className="text-lg font-medium text-gray-900">
                        {(item.assignedTo as any).name}
                      </p>
                    </div>
                  </div>
                )}

                {item.notes && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Notes</p>
                      <p className="text-gray-700 mt-1">{item.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vendor Information Card */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Building2 size={20} />
                Vendor Information
              </h2>
              {item.vendorname ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Vendor Name</p>
                      <p className="text-lg font-medium text-gray-900">{item.vendorname}</p>
                    </div>
                  </div>

                  {item.vendorContact && (
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contact</p>
                        <a 
                          href={`tel:${item.vendorContact}`} 
                          className="text-blue-600 hover:underline"
                        >
                          {item.vendorContact}
                        </a>
                      </div>
                    </div>
                  )}

                  {item.vendorEmail && (
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <a 
                          href={`mailto:${item.vendorEmail}`} 
                          className="text-blue-600 hover:underline break-all"
                        >
                          {item.vendorEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {item.vendorAddress && (
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="text-gray-700">{item.vendorAddress}</p>
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

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Calendar size={24} className="text-blue-600" />
              <span>Assignment History</span>
            </h2>
            <div className="space-y-6">
              {item.assignmentHistory && item.assignmentHistory.length > 0 ? (
                [...item.assignmentHistory].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()).map((assignment, index) => (
                  <div key={index} className="p-5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-3 sm:mb-0">
                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                          <User size={16} className="text-gray-500" />
                          <span>{(assignment as any).user?.name || 'Unknown User'}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(assignment.assignedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Action</p>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              assignment.action === 'assigned'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                            {assignment.action.charAt(0).toUpperCase() + assignment.action.slice(1)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-semibold text-gray-800">{assignment.quantity}</p>
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
