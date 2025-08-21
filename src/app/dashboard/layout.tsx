 import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 flex-none bg-white border-r">
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-2xl font-bold text-indigo-600">SM Inventory</h1>
        </div>
        <div className="flex flex-col flex-grow p-4 space-y-2">
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200">
            Inventory
          </Link>
          <Link href="/dashboard/users" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200">
            Users
          </Link>
          <Link href="/dashboard/vendors" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200">
            Vendors
          </Link>
          <Link href="/dashboard/history" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200">
            Assignment Log
          </Link>
          <Link href="/dashboard/scrap" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200">
            Scrap Materials
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-grow min-w-0">
        <div className="bg-white border-b">
          <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Welcome, {session.user?.name}</h2>
            </div>
            <div>
              <SignOutButton />
            </div>
          </div>
        </div>
        <main className="flex-grow p-8 overflow-auto min-w-0">
            {children}
        </main>
      </div>
    </div>
  );
}
