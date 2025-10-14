'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function Sidebar() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const toggleInventoryDropdown = () => {
    setIsInventoryOpen(!isInventoryOpen);
  };

  return (
    <div className="flex flex-col flex-grow p-4 space-y-2">
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
            <Link
              href="/dashboard/stock"
              className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/stock' ? 'text-white' : ''}`}
              style={pathname === '/dashboard/stock' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
            >
              Stock Tracker
            </Link>
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

      <Link
        href="/dashboard/users"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/users' ? 'text-white' : ''}`}
        style={pathname === '/dashboard/users' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
      >
        Users
      </Link>
      <Link
        href="/dashboard/vendors"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/vendors' ? 'text-white' : ''}`}
        style={pathname === '/dashboard/vendors' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
      >
        Vendors
      </Link>
      <Link
        href="/dashboard/scrap"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/scrap' ? 'text-white' : ''}`}
        style={pathname === '/dashboard/scrap' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
      >
        Scrap Materials
      </Link>
      <Link
        href="/dashboard/requests"
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/requests' ? 'text-white' : ''}`}
        style={pathname === '/dashboard/requests' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
      >
        My Requests
      </Link>
    </div>
  );
}
