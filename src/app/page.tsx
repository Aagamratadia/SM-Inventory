import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  // This part will not be reached due to redirects, but it's good practice
  // to have a fallback return statement.
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Loading...</h1>
    </div>
  );
}
