import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import RequestModel from '@/models/Request';

// GET /api/warehouse/requests/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(['admin','warehouse'] as any[]).includes((session.user as any).role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid request id' }, { status: 400 });
  }
  try {
    await dbConnect();
    const doc = await RequestModel.findById(id);
    if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(doc, { status: 200 });
  } catch (err) {
    console.error('GET /api/warehouse/requests/[id] error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
