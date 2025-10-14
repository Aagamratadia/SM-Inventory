import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import RequestModel from '@/models/Request';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid request id' }, { status: 400 });
  }

  try {
    await dbConnect();
    const reqDoc = await RequestModel.findById(id);
    if (!reqDoc) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const isAdmin = (session.user as any).role === 'admin';
    const isOwner = reqDoc.requesterId.toString() === session.user.id;
    if (!isAdmin && !isOwner) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    return NextResponse.json(reqDoc, { status: 200 });
  } catch (err) {
    console.error('GET /api/requests/[id] error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
