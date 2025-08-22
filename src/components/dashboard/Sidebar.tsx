'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export default function Sidebar() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const pathname = usePathname();

  const toggleInventoryDropdown = () => {
    setIsInventoryOpen(!isInventoryOpen);
  };

  return (
    <div className="flex flex-col flex-grow p-4 space-y-2">
      <div>
        <button onClick={toggleInventoryDropdown} className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none">
          <span>Inventory</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isInventoryOpen ? 'transform rotate-180' : ''}`} />
        </button>
        {isInventoryOpen && (
          <div className="pl-4 mt-2 space-y-2">
            <Link href="/dashboard" className={`block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200 ${pathname === '/dashboard' ? 'bg-gray-200' : ''}`}>
              All Items
            </Link>
            <Link href="/dashboard/history" className={`block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200 ${pathname === '/dashboard/history' ? 'bg-gray-200' : ''}`}>
              Assignment Log
            </Link>
            <Link href="/dashboard/stock" className={`block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200 ${pathname === '/dashboard/stock' ? 'bg-gray-200' : ''}`}>
              Stock Tracker
            </Link>
          </div>
        )}
      </div>

      <Link href="/dashboard/users" className={`px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200 ${pathname === '/dashboard/users' ? 'bg-gray-200' : ''}`}>
        Users
      </Link>
      <Link href="/dashboard/vendors" className={`px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200 ${pathname === '/dashboard/vendors' ? 'bg-gray-200' : ''}`}>
        Vendors
      </Link>
      <Link href="/dashboard/scrap" className={`px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200 ${pathname === '/dashboard/scrap' ? 'bg-gray-200' : ''}`}>
        Scrap Materials
      </Link>
    </div>
  );
}
