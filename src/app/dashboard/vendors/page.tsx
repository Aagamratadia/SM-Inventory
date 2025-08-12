'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import AddVendorForm from '@/components/vendors/AddVendorForm';
import EditVendorForm from '@/components/vendors/EditVendorForm';
import { IVendor } from '@/models/Vendor';

interface VendorWithItems extends IVendor {
  items?: string[];
  contactInfo?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<VendorWithItems | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<VendorWithItems | null>(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendors');
      if (!res.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await res.json();
      setVendors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleVendorAdded = (newVendor: IVendor) => {
    // On creation, items may not be present; re-fetch to include items aggregation
    fetchVendors();
    setIsAddModalOpen(false);
  };

  const handleVendorUpdated = (updated: IVendor) => {
    setVendors((prev) => prev.map((v) => (v._id === updated._id ? { ...v, ...updated } as VendorWithItems : v)));
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      const res = await fetch(`/api/vendors/${vendorToDelete._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete vendor');
      }
      setVendors((prev) => prev.filter((v) => v._id !== vendorToDelete._id));
      setVendorToDelete(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Add Vendor
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors.map((v) => (
              <tr key={v._id as string}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {v.items && v.items.length > 0 ? v.items.join(', ') : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{(v as any).contactInfo || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button onClick={() => setVendorToEdit(v)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button onClick={() => setVendorToDelete(v)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Vendor">
        <AddVendorForm onVendorAdded={handleVendorAdded} onClose={() => setIsAddModalOpen(false)} />
      </Modal>

      {vendorToEdit && (
        <Modal isOpen={!!vendorToEdit} onClose={() => setVendorToEdit(null)} title="Edit Vendor">
          <EditVendorForm
            vendor={vendorToEdit}
            onVendorUpdated={handleVendorUpdated}
            onClose={() => setVendorToEdit(null)}
          />
        </Modal>
      )}

      {vendorToDelete && (
        <Modal isOpen={!!vendorToDelete} onClose={() => setVendorToDelete(null)} title="Delete Vendor">
          <div className="text-center">
            <p>Are you sure you want to delete <strong>{vendorToDelete.name}</strong>?</p>
            <div className="mt-6 flex justify-center space-x-4">
              <button onClick={() => setVendorToDelete(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleDeleteVendor} className="px-4 py-2 text-white bg-red-600 rounded">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
