import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import RequestModel from '@/models/Request';

// GET /api/warehouse/requests?fulfilled=false
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(['admin','warehouse'] as any[]).includes((session.user as any).role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const fulfilled = searchParams.get('fulfilled');

    const filter: any = { status: 'Approved' };
    if (fulfilled === 'true') {
      filter.status = 'Completed';
    } else if (fulfilled === 'false') {
      filter.fulfilledAt = { $exists: false };
    }

    const requests = await RequestModel.find(filter)
      .populate('requesterId', 'name email')
      .sort({ submittedAt: 1 });
    return NextResponse.json(requests, { status: 200 });
  } catch (err) {
    console.error('GET /api/warehouse/requests error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
