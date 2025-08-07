'use client';

import React, { useState, useEffect } from 'react';
import { IItem } from '@/models/Item';

interface EditItemFormProps {
  item: IItem;
  onItemUpdated: (item: IItem) => void;
  onClose: () => void;
}

export default function EditItemForm({ item, onItemUpdated, onClose }: EditItemFormProps) {
  const [formData, setFormData] = useState<Partial<IItem>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        itemId: item.itemId,
        shape: item.shape,
        carat: item.carat,
        clarity: item.clarity,
        color: item.color,
        price: item.price,
        notes: item.notes,
      });
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/items/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update item');
      }

      const updatedItem = await res.json();
      onItemUpdated(updatedItem);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Name" required className="w-full px-3 py-2 border rounded" />
        <input name="itemId" value={formData.itemId || ''} onChange={handleChange} placeholder="Item ID" required className="w-full px-3 py-2 border rounded" />
        <input name="shape" value={formData.shape || ''} onChange={handleChange} placeholder="Shape" className="w-full px-3 py-2 border rounded" />
        <input type="number" name="carat" value={formData.carat || ''} onChange={handleChange} placeholder="Carat" className="w-full px-3 py-2 border rounded" />
        <input name="clarity" value={formData.clarity || ''} onChange={handleChange} placeholder="Clarity" className="w-full px-3 py-2 border rounded" />
        <input name="color" value={formData.color || ''} onChange={handleChange} placeholder="Color" className="w-full px-3 py-2 border rounded" />
        <input type="number" name="price" value={formData.price || ''} onChange={handleChange} placeholder="Price" className="w-full px-3 py-2 border rounded" />
      </div>
      <textarea name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Notes" className="w-full px-3 py-2 border rounded"></textarea>
      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-white bg-indigo-600 rounded disabled:bg-indigo-300">
          {submitting ? 'Updating...' : 'Update Item'}
        </button>
      </div>
    </form>
  );
}
