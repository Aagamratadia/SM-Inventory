'use client';

import React, { useState, useEffect } from 'react';
import { IItem } from '@/models/Item';
import Modal from '@/components/ui/Modal';
import AddItemForm from '@/components/inventory/AddItemForm';
import EditItemForm from '@/components/inventory/EditItemForm';

export default function ScrapPage() {
  const [scrapItems, setScrapItems] = useState<IItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<IItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<IItem | null>(null);

  const fetchScrapItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items/scrap');
      if (!res.ok) {
        throw new Error('Failed to fetch scrap items');
      }
      const data = await res.json();
      setScrapItems(data);
      setFilteredItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapItems();
  }, []);

  useEffect(() => {
    const results = scrapItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(results);
  }, [searchTerm, scrapItems]);

  const handleAddItemSuccess = (newItem: IItem) => {
    setScrapItems((prevItems) => [...prevItems, newItem]);
    setIsAddItemModalOpen(false);
  };

  const handleItemUpdated = (updatedItem: IItem) => {
    setScrapItems((prevItems) =>
      prevItems.map((item) => (item._id === updatedItem._id ? updatedItem : item))
    );
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await fetch(`/api/items/${itemToDelete._id}`, { method: 'DELETE' });
      setScrapItems((prevItems) => prevItems.filter((item) => item._id !== itemToDelete._id));
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
        <h1 className="text-3xl font-bold">Scrap Materials</h1>
        <button onClick={() => setIsAddItemModalOpen(true)} className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Add New Scrap Item
        </button>
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scrapped On</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item._id as string}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {item.scrappedAt ? new Date(item.scrappedAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => setItemToEdit(item)} className="px-1.5 py-0.5 text-xs text-white bg-indigo-600 rounded">Edit</button>
                  <button onClick={() => setItemToDelete(item)} className="px-1.5 py-0.5 text-xs text-white bg-red-600 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} title="Add New Scrap Item">
        <AddItemForm 
            onSuccess={handleAddItemSuccess} 
            onClose={() => setIsAddItemModalOpen(false)}
            isScrap={true}
        />
      </Modal>

      {itemToEdit && (
        <Modal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} title="Edit Scrap Item">
          <EditItemForm 
            item={itemToEdit}
            onItemUpdated={handleItemUpdated} 
            onClose={() => setItemToEdit(null)} 
          />
        </Modal>
      )}

      {itemToDelete && (
        <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Delete Scrap Item">
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
