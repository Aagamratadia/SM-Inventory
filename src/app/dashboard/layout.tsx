import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';
import { redirect } from 'next/navigation';
import UserMenu from '@/components/auth/UserMenu';
import Sidebar from '@/components/dashboard/Sidebar';
import Image from 'next/image';

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
        <div className="border-b">
          <div className="relative w-full h-24 md:h-28">{/* Reduced height */}
            <Image
              src="/Logo2.jpg"
              alt="SM Inventory Logo"
              fill
              priority
              sizes="240px"
              className="object-contain object-center px-2 py-1"
            />
          </div>
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
