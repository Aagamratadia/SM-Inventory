'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import AddUserForm from '@/components/users/AddUserForm';
import EditUserForm from '@/components/users/EditUserForm';
import { IUser } from '@/models/User';

export default function UsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/users');
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserAdded = (newUser: IUser) => {
    setUsers((prevUsers) => [...prevUsers, newUser]);
  };

  const handleUserUpdated = (updatedUser: IUser) => {
    setUsers((prevUsers) => prevUsers.map((user) => (user._id === updatedUser._id ? updatedUser : user)));
  };

  const openDeleteModal = (user: IUser) => {
    setUserToDelete(user);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/users/${userToDelete._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete user');
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userToDelete._id));
      closeDeleteModal();
    } catch (err: any) {
      setError(err.message);
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
        <h1 className="text-3xl font-bold">User Management</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Add New User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Items</th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id as string}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0 (TBD)</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button onClick={() => setUserToEdit(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button onClick={() => openDeleteModal(user)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New User">
        <AddUserForm
          onUserAdded={handleUserAdded}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

      {userToEdit && (
        <Modal isOpen={!!userToEdit} onClose={() => setUserToEdit(null)} title="Edit User">
            <EditUserForm 
                user={userToEdit}
                onUserUpdated={handleUserUpdated}
                onClose={() => setUserToEdit(null)}
            />
        </Modal>
      )}

      {userToDelete && (
        <Modal isOpen={!!userToDelete} onClose={closeDeleteModal} title="Delete User">
          <div className="text-center">
            <p className="text-lg">Are you sure you want to delete <strong>{userToDelete.name}</strong>?</p>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="mt-6 flex justify-center space-x-4">
              <button onClick={closeDeleteModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
