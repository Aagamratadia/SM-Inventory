'use client';

import React, { useState, useEffect } from 'react';


import Modal from '@/components/ui/Modal';
import AddItemForm from '@/components/inventory/AddItemForm';
import EditItemForm from '@/components/inventory/EditItemForm';
import AssignItemForm from '@/components/inventory/AssignItemForm';
import { IItem } from '@/models/Item';
import Link from 'next/link';

export default function InventoryPage() {
  const [items, setItems] = useState<IItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  // Removed Import modal per request; now using Stock Tracker page instead
  const [itemToEdit, setItemToEdit] = useState<IItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<IItem | null>(null);
  const [itemToAssign, setItemToAssign] = useState<IItem | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      if (!res.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await res.json();
      setItems(data);
      setFilteredItems(data); // Also initialize filtered items
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const results = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(results);
  }, [searchTerm, items]);

  // Import flow removed

  const handleAddItemSuccess = (newItem: IItem) => {
    setItems((prevItems) => [...prevItems, newItem]);
    setIsAddItemModalOpen(false);
  };

    const handleItemAssigned = (updatedItem: IItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item._id === updatedItem._id ? updatedItem : item))
    );
  };

  const handleReturnItem = async (itemToReturn: IItem) => {
    try {
      const res = await fetch(`/api/items/${itemToReturn._id}/return`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to return item');
      }
      const updatedItem = await res.json();
      handleItemAssigned(updatedItem); // reuse update logic
    } catch (error) {
      console.error('Failed to return item', error);
      setError('Failed to return item');
    }
  };

  const handleItemUpdated = (updatedItem: IItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item._id === updatedItem._id ? updatedItem : item))
    );
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await fetch(`/api/items/${itemToDelete._id}`, { method: 'DELETE' });
      setItems((prevItems) => prevItems.filter((item) => item._id !== itemToDelete._id));
      setItemToDelete(null);
    } catch (error) {
      console.error('Failed to delete item', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <div className="flex space-x-4">
          <Link href="/dashboard/stock" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
            Stock Tracker
          </Link>
          <Link href="/dashboard/history" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Assignment History
          </Link>
          <button onClick={() => setIsAddItemModalOpen(true)} className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Add New Item
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item._id as string}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.price ? `₹${item.price.toLocaleString()}` : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {item.assignedTo ? 
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Assigned</span> : 
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(item.assignedTo as any)?.name || 'Available'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {item.assignedTo ? (
                    <button onClick={() => handleReturnItem(item)} className="px-2 py-1 text-xs text-white bg-yellow-600 rounded">Return</button>
                  ) : (
                    <button onClick={() => setItemToAssign(item)} className="px-2 py-1 text-xs text-white bg-blue-600 rounded">Assign</button>
                  )}
                  <Link href={`/dashboard/items/${item._id}`} className="px-2 py-1 text-xs text-white bg-gray-600 rounded">Details</Link>
                  <button onClick={() => setItemToEdit(item)} className="px-2 py-1 text-xs text-white bg-indigo-600 rounded">Edit</button>
                  <button onClick={() => setItemToDelete(item)} className="px-2 py-1 text-xs text-white bg-red-600 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} title="Add New Item">
        <AddItemForm 
            onSuccess={handleAddItemSuccess} 
            onClose={() => setIsAddItemModalOpen(false)}
        />
      </Modal>

      {itemToEdit && (
        <Modal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} title="Edit Item">
          <EditItemForm 
            item={itemToEdit}
            onItemUpdated={handleItemUpdated} 
            onClose={() => setItemToEdit(null)} 
          />
        </Modal>
      )}

      {itemToAssign && (
        <Modal isOpen={!!itemToAssign} onClose={() => setItemToAssign(null)} title={`Assign ${itemToAssign.name}`}>
            <AssignItemForm 
                item={itemToAssign}
                onItemAssigned={handleItemAssigned}
                onClose={() => setItemToAssign(null)}
            />
        </Modal>
      )}

      {/* Removed Return modal and Import modal */}

      {itemToDelete && (
        <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Delete Item">
          <div className="text-center">
            <p>Are you sure you want to delete <strong>{itemToDelete.name}</strong>?</p>
            <div className="mt-6 flex justify-center space-x-4">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleDeleteItem} className="px-4 py-2 text-white bg-red-600 rounded">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
