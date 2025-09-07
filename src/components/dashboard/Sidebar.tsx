'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Package, ListChecks, History, Boxes, Users, Building2, Recycle } from 'lucide-react';

export default function Sidebar() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const pathname = usePathname();

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
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isInventoryOpen ? 'transform rotate-180' : ''}`} />
        </button>
        {isInventoryOpen && (
          <div className="pl-4 mt-2 space-y-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard' ? 'text-white' : ''}`}
              style={pathname === '/dashboard' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
            >
              <ListChecks className="w-4 h-4" />
              <span>All Items</span>
            </Link>
            <Link
              href="/dashboard/history"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/history' ? 'text-white' : ''}`}
              style={pathname === '/dashboard/history' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
            >
              <History className="w-4 h-4" />
              <span>Assignment Log</span>
            </Link>
            <Link
              href="/dashboard/stock"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/stock' ? 'text-white' : ''}`}
              style={pathname === '/dashboard/stock' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
            >
              <Boxes className="w-4 h-4" />
              <span>Stock Tracker</span>
            </Link>
          </div>
        )}
      </div>

      <Link
        href="/dashboard/users"
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/users' ? 'text-white' : ''}`}
        style={pathname === '/dashboard/users' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
      >
        <Users className="w-4 h-4" />
        <span>Users</span>
      </Link>
      <Link
        href="/dashboard/vendors"
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/vendors' ? 'text-white' : ''}`}
        style={pathname === '/dashboard/vendors' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
      >
        <Building2 className="w-4 h-4" />
        <span>Vendors</span>
      </Link>
      <Link
        href="/dashboard/scrap"
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 hover:text-white ${pathname === '/dashboard/scrap' ? 'text-white' : ''}`}
        style={pathname === '/dashboard/scrap' ? { backgroundColor: '#6366F1' } : { color: '#4B5563' }}
      >
        <Recycle className="w-4 h-4" />
        <span>Scrap Materials</span>
      </Link>
    </div>
  );
}
