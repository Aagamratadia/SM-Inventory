import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import RequestModel from '@/models/Request';

// GET /api/admin/requests?status=Pending
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'Pending';

    const requests = await RequestModel.find({ status }).sort({ submittedAt: 1 });
    return NextResponse.json(requests, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/requests error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
