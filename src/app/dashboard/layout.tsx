 import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';
import { redirect } from 'next/navigation';
import UserMenu from '@/components/auth/UserMenu';
import Sidebar from '@/components/dashboard/Sidebar';

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
    <div className="flex h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-60 flex-none bg-white border-r">
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-2xl font-bold" style={{ color: '#6366F1' }}>SM Inventory</h1>
        </div>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-grow min-w-0">
        <div className="bg-white border-b">
          <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* room for breadcrumb or page icon */}
            </div>
            <div>
              <UserMenu name={session.user?.name} />
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
