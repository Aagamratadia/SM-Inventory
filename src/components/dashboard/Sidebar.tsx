'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function Sidebar() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'admin';
  const isWarehouse = userRole === 'warehouse';

  const toggleInventoryDropdown = () => {
    setIsInventoryOpen(!isInventoryOpen);
  };

  const toggleRequestsDropdown = () => {
    setIsRequestsOpen(!isRequestsOpen);
  };

  const toggleAdminDropdown = () => {
    setIsAdminOpen(!isAdminOpen);
  };

  const toggleManagementDropdown = () => {
    setIsManagementOpen(!isManagementOpen);
  };

  return (
    <div className="flex flex-col flex-grow p-4 space-y-2">
      {/* Inventory Section */}
      <div>
        <button
          onClick={toggleInventoryDropdown}
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none"
          style={{ color: '#4B5563' }}
        >
          <span>Inventory</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isInventoryOpen ? 'transform rotate-180' : ''}`} />
        </button>
        {isInventoryOpen && (
          <div className="pl-4 mt-2 space-y-2">
            <Link
              href="/dashboard"
              className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard' ? 'text-white' : ''}`}
              style={pathname === '/dashboard' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
            >
              All Items
            </Link>
            <Link
              href="/dashboard/history"
              className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/history' ? 'text-white' : ''}`}
              style={pathname === '/dashboard/history' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
            >
              Assignment Log
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/stock"
                className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/stock' ? 'text-white' : ''}`}
                style={pathname === '/dashboard/stock' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
              >
                Stock Tracker
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Requests Section */}
      <div>
        <button
          onClick={toggleRequestsDropdown}
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none"
          style={{ color: '#4B5563' }}
        >
          <span>Requests</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isRequestsOpen ? 'transform rotate-180' : ''}`} />
        </button>
        {isRequestsOpen && (
          <div className="pl-4 mt-2 space-y-2">
            <Link
              href="/dashboard/requests"
              className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/requests' ? 'text-white' : ''}`}
              style={pathname === '/dashboard/requests' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
            >
              My Requests
            </Link>
            <Link
              href="/dashboard/requests/new"
              className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/requests/new' ? 'text-white' : ''}`}
              style={pathname === '/dashboard/requests/new' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
            >
              New Request
            </Link>
          </div>
        )}
      </div>

      {/* Admin Section - Admin Only */}
      {(isAdmin || isWarehouse) && (
        <div>
          <button
            onClick={toggleAdminDropdown}
            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none"
            style={{ color: '#4B5563' }}
          >
            <span>Admin</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isAdminOpen ? 'transform rotate-180' : ''}`} />
          </button>
          {isAdminOpen && (
            <div className="pl-4 mt-2 space-y-2">
              {isAdmin && (
                <Link
                  href="/admin/approvals"
                  className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname.startsWith('/admin/approvals') ? 'text-white' : ''}`}
                  style={pathname.startsWith('/admin/approvals') ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
                >
                  Approval Queue
                </Link>
              )}
              <Link
                href="/warehouse"
                className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname.startsWith('/warehouse') ? 'text-white' : ''}`}
                style={pathname.startsWith('/warehouse') ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
              >
                Warehouse Queue
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Management Section - Admin Only */}
      {isAdmin && (
        <div>
          <button
            onClick={toggleManagementDropdown}
            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none"
            style={{ color: '#4B5563' }}
          >
            <span>Management</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isManagementOpen ? 'transform rotate-180' : ''}`} />
          </button>
          {isManagementOpen && (
            <div className="pl-4 mt-2 space-y-2">
              <Link
                href="/dashboard/users"
                className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/users' ? 'text-white' : ''}`}
                style={pathname === '/dashboard/users' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
              >
                Users
              </Link>
              <Link
                href="/dashboard/reports"
                className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/reports' ? 'text-white' : ''}`}
                style={pathname === '/dashboard/reports' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
              >
                Reports
              </Link>
              <Link
                href="/dashboard/vendors"
                className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/vendors' ? 'text-white' : ''}`}
                style={pathname === '/dashboard/vendors' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
              >
                Vendors
              </Link>
              <Link
                href="/dashboard/scrap"
                className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/scrap' ? 'text-white' : ''}`}
                style={pathname === '/dashboard/scrap' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
              >
                Scrap Materials
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
