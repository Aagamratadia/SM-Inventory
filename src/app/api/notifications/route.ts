import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';

// GET /api/notifications?scope=mine|admin&unread=true
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') || 'mine';
  const unread = searchParams.get('unread') === 'true';

  try {
    await dbConnect();
    const isAdmin = (session.user as any).role === 'admin';

    const filter: any = {};
    if (scope === 'admin') {
      if (!isAdmin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      filter.recipientRole = 'admin';
    } else {
      filter.recipientId = session.user.id;
    }
    if (unread) filter.read = false;

    const results = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/notifications -> mark as read by ids
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  const scope: 'mine' | 'admin' = body?.scope === 'admin' ? 'admin' : 'mine';

  try {
    await dbConnect();
    const isAdmin = (session.user as any).role === 'admin';

    const filter: any = { _id: { $in: ids } };
    if (scope === 'admin') {
      if (!isAdmin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      filter.recipientRole = 'admin';
    } else {
      filter.recipientId = session.user.id;
    }

    await Notification.updateMany(filter, { $set: { read: true } });
    return NextResponse.json({ message: 'Updated' }, { status: 200 });
  } catch (err) {
    console.error('PATCH /api/notifications error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
