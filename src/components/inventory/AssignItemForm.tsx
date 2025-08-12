'use client';

import React, { useState, useEffect } from 'react';
import { IUser } from '@/models/User';
import { IItem } from '@/models/Item';

interface AssignItemFormProps {
  item: IItem;
  onItemAssigned: (item: IItem) => void;
  onClose: () => void;
}

export default function AssignItemForm({ item, onItemAssigned, onClose }: AssignItemFormProps) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
        if (data.length > 0) {
          setSelectedUserId(data[0]._id);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user.');
      return;
    }
    if (!item.quantity || quantity < 1 || quantity > (item.quantity || 0)) {
      setError('Please select a valid quantity.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/items/${item._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, quantity }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to assign item');
      }

      const updatedItem = await res.json();
      onItemAssigned(updatedItem);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label htmlFor="user" className="block text-sm font-medium text-gray-700">
          Assign to
        </label>
        <select
          id="user"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>Select a user</option>
          {users.map((user) => (
            <option key={user._id as string} value={user._id as string}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          Quantity (Available: {item.quantity || 0})
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {Array.from({ length: item.quantity || 0 }, (_, idx) => idx + 1).map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!selectedUserId || submitting || (item.quantity || 0) === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {submitting ? 'Assigning...' : 'Assign Item'}
        </button>
      </div>
    </form>
  );
}
