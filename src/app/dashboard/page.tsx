'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';


import Modal from '@/components/ui/Modal';
import AddItemForm from '@/components/inventory/AddItemForm';
import EditItemForm from '@/components/inventory/EditItemForm';
import AssignItemForm from '@/components/inventory/AssignItemForm';
import { IItem } from '@/models/Item';
import Link from 'next/link';
import { Plus, Search, MoreVertical, UserPlus, ChevronUp } from 'lucide-react';

export default function InventoryPage() {
  const { data: session } = useSession();
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

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

  const handleItemUpdated = (updatedItem: IItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item._id === updatedItem._id ? updatedItem : item))
    );
  };

  const toggleHistory = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDeleteAssignment = async (itemId: string, assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment entry? This will revert the stock changes.')) {
      return;
    }
    try {
      const res = await fetch(`/api/items/${itemId}/assignments/${assignmentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete assignment');
      }
      const updatedItem = await res.json();
      setItems(prevItems =>
        prevItems.map(item => (item._id === updatedItem._id ? updatedItem : item))
      );
    } catch (err: any) {
      setError(err.message);
    }
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
    <div className="px-8 pt-4 pb-8 min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>Inventory</h1>
          <p className="mt-1" style={{ color: '#4B5563' }}>Manage your inventory items and track stock levels</p>
        </div>
        <button onClick={() => setIsAddItemModalOpen(true)} className="flex items-center px-4 py-2 text-white rounded-md transition-colors duration-200 hover:bg-indigo-700" style={{ backgroundColor: '#6366F1' }}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Item
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ borderColor: '#E5E7EB', color: '#111827', backgroundColor: '#FFFFFF' }}
        />
      </div>

      <div className="shadow-md rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                  <span className="inline-flex items-center justify-center rounded-full text-center whitespace-nowrap" style={{ border: '0.75px solid #6366F1', backgroundColor: 'rgba(99,102,241,0.85)', color: '#FFFFFF', padding: '5px 14px' }}>Name</span>
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                  <span className="inline-flex items-center justify-center rounded-full text-center whitespace-nowrap" style={{ border: '0.75px solid #6366F1', backgroundColor: 'rgba(99,102,241,0.85)', color: '#FFFFFF', padding: '5px 14px' }}>Category</span>
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                  <span className="inline-flex items-center justify-center rounded-full text-center whitespace-nowrap" style={{ border: '0.75px solid #6366F1', backgroundColor: 'rgba(99,102,241,0.85)', color: '#FFFFFF', padding: '5px 14px' }}>On Hand</span>
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                  <span className="inline-flex items-center justify-center rounded-full text-center whitespace-nowrap" style={{ border: '0.75px solid #6366F1', backgroundColor: 'rgba(99,102,241,0.85)', color: '#FFFFFF', padding: '5px 14px' }}>Reserved</span>
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                  <span className="inline-flex items-center justify-center rounded-full text-center whitespace-nowrap" style={{ border: '0.75px solid #6366F1', backgroundColor: 'rgba(99,102,241,0.85)', color: '#FFFFFF', padding: '5px 14px' }}>Available</span>
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                  <span className="inline-flex items-center justify-center rounded-full text-center whitespace-nowrap" style={{ border: '0.75px solid #6366F1', backgroundColor: 'rgba(99,102,241,0.85)', color: '#FFFFFF', padding: '5px 14px' }}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#E5E7EB' }}>
              {filteredItems.map((item) => (
                <React.Fragment key={item._id as string}>
                  <tr>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#111827' }}>{item.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" style={{ backgroundColor: '#F9FAFB', color: '#4B5563' }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#111827' }}>{item.quantity || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#111827' }}>{(item as any).reserved || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#111827' }}>{(item.quantity || 0) - ((item as any).reserved || 0)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {(item.quantity || 0) > 0 && (
                          <button onClick={() => {
                            if (session?.user?.role === 'admin') {
                              setItemToAssign(item);
                            } else {
                              // navigate to the request form
                              window.location.href = '/dashboard/requests/new';
                            }
                          }} className="flex items-center px-3 py-1.5 text-xs text-white rounded-md transition-colors hover:bg-indigo-700" style={{ backgroundColor: '#6366F1' }}>
                            <UserPlus className="w-4 h-4 mr-1.5" />
                            {session?.user?.role === 'admin' ? 'Assign' : 'Request'}
                          </button>
                        )}
                        <div className="relative">
                          <button onClick={() => setActiveActionMenu(activeActionMenu === item._id ? null : item._id as string)} className="p-2 rounded-full hover:bg-gray-100">
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                          {activeActionMenu === item._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                <Link href={`/dashboard/items/${item._id}`} className="block px-4 py-2 text-sm hover:bg-gray-100" style={{ color: '#4B5563' }}>Details</Link>
                                <button onClick={() => { setItemToEdit(item); setActiveActionMenu(null); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" style={{ color: '#4B5563' }}>Edit</button>
                                <button onClick={() => { setItemToDelete(item); setActiveActionMenu(null); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50" style={{ color: '#DC2626' }}>Delete</button>
                                <button onClick={() => { toggleHistory(item._id as string); setActiveActionMenu(null); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" style={{ color: '#4B5563' }}>
                                  {expandedItems.has(item._id as string) ? 'Hide History' : 'Show History'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {expandedItems.has(item._id as string) && (
                    <tr>
                      <td colSpan={5} className="p-4" style={{ backgroundColor: '#F9FAFB' }}>
                        <div className="relative">
                          <button
                            onClick={() => toggleHistory(item._id as string)}
                            className="absolute top-0 right-0 p-2 rounded-full hover:bg-gray-100"
                            title="Collapse"
                            aria-label="Collapse history"
                          >
                            <ChevronUp className="w-4 h-4" style={{ color: '#4B5563' }} />
                          </button>
                          <h4 className="font-bold mb-2 pr-8 text-sm" style={{ color: '#111827' }}>Assignment History for {item.name}</h4>
                        {item.assignmentHistory && item.assignmentHistory.length > 0 ? (
                          <table className="min-w-full divide-y" style={{ borderColor: '#E5E7EB' }}>
                            <thead style={{ backgroundColor: '#F9FAFB' }}>
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: '#4B5563' }}>Assigned To</th>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: '#4B5563' }}>Assigned By</th>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: '#4B5563' }}>Action</th>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: '#4B5563' }}>Quantity</th>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: '#4B5563' }}>Assigned At</th>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase" style={{ color: '#4B5563' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y" style={{ borderColor: '#E5E7EB' }}>
                              {[...item.assignmentHistory].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()).map(assignment => (
                                <tr key={assignment._id as string}>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs" style={{ color: '#111827' }}>{(assignment.user as any)?.name}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs" style={{ color: '#111827' }}>{(assignment.performedBy as any)?.name}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs" style={{ color: '#111827' }}>{assignment.action}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs" style={{ color: '#111827' }}>{assignment.quantity}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs" style={{ color: '#111827' }}>{new Date(assignment.assignedAt).toLocaleString()}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <button onClick={() => handleDeleteAssignment(item._id as string, assignment._id as string)} className="px-1.5 py-0.5 text-xs text-white rounded" style={{ backgroundColor: '#DC2626' }}>Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-xs" style={{ color: '#4B5563' }}>No assignment history for this item.</p>
                        )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
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

      {itemToDelete && (
        <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Delete Item">
          <div className="text-center">
            <p style={{ color: '#111827' }}>Are you sure you want to delete <strong>{itemToDelete.name}</strong>?</p>
            <div className="mt-6 flex justify-center space-x-4">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded" style={{ backgroundColor: '#E5E7EB', color: '#4B5563' }}>Cancel</button>
              <button onClick={handleDeleteItem} className="px-4 py-2 text-white rounded" style={{ backgroundColor: '#DC2626' }}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
