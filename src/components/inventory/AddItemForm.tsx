'use client';

import React, { useState } from 'react';


import { IItem } from '@/models/Item';

interface AddItemFormProps {
  onSuccess: (newItem: IItem) => void;
  onClose: () => void;
}

export default function AddItemForm({ onSuccess, onClose }: AddItemFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    vendorname: '',
    quantity: '',
    price: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Item name is required.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            price: formData.price ? Number(formData.price) : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create item');
      }

      const newItem = await res.json();
      onSuccess(newItem);
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Category *</label>
        <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name *</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Vendor Name *</label>
        <input type="text" name="vendorname" id="vendorname" value={formData.vendorname} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" name="quantity" placeholder="Quantity" value={formData.quantity} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
        <input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
      </div>
      <div>
        <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleChange} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"></textarea>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
          {submitting ? 'Adding...' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}
