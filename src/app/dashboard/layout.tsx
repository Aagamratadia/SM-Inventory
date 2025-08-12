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
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
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
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-grow">
        <div className="flex items-center justify-between h-16 px-8 bg-white border-b">
          <div>
            <h2 className="text-lg font-semibold">Welcome, {session.user?.name}</h2>
          </div>
          <div>
            <SignOutButton />
          </div>
        </div>
        <main className="flex-grow p-8 overflow-auto">
            {children}
        </main>
      </div>
    </div>
  );
}
