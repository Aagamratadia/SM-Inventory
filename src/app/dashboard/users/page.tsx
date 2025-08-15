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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Add New User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
              <th className="relative px-4 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id as string}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 max-w-[180px]"><span className="block truncate" title={user.name}>{user.name}</span></td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 max-w-[260px]"><span className="block truncate" title={user.email}>{user.email}</span></td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell max-w-[200px]"><span className="block truncate" title={(user as any).department || ''}>{(user as any).department || '-'}</span></td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 capitalize hidden sm:table-cell">{user.role}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative inline-block text-left" tabIndex={0}
                       onBlur={(e) => {
                         // Close when focus leaves the menu container
                         if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenMenuId(null);
                       }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === (user._id as string) ? null : (user._id as string))}
                      className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === (user._id as string)}
                      aria-label="Open actions"
                    >
                      {/* Heroicons: Ellipsis Vertical */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                        <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                      </svg>
                    </button>
                    {openMenuId === (user._id as string) && (
                      <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu">
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          role="menuitem"
                          onClick={() => {
                            setUserToEdit(user);
                            setOpenMenuId(null);
                          }}
                        >
                          {/* Pencil icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182L7.5 20.213 3 21l.787-4.5L16.862 4.487z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          role="menuitem"
                          onClick={() => {
                            openDeleteModal(user);
                            setOpenMenuId(null);
                          }}
                        >
                          {/* Trash icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.916 21.75H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.06.68-.114 1.022-.165m0 0A48.11 48.11 0 0 1 7.5 5.25m0 0V4.875c0-1.035.84-1.875 1.875-1.875h5.25c1.035 0 1.875.84 1.875 1.875V5.25m-9 0h9" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
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
