import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionProvider from '@/components/SessionProvider';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SM Inventory Management',
  description: 'Diamond and Jewelry Inventory Management System',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
