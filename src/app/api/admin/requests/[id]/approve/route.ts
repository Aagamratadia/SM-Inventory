import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import RequestModel from '@/models/Request';
import Notification from '@/models/Notification';

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid request id' }, { status: 400 });
  }

  await dbConnect();
  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const reqDoc = await RequestModel.findById(id).session(dbSession);
      if (!reqDoc) throw Object.assign(new Error('Not found'), { status: 404 });
      if (reqDoc.status !== 'Pending') throw Object.assign(new Error('Not pending'), { status: 409 });

      // Mark as Approved only; warehouse will fulfill and move stock
      reqDoc.status = 'Approved';
      reqDoc.decisionAt = new Date();
      reqDoc.decisionBy = new mongoose.Types.ObjectId(session.user.id);
      await reqDoc.save({ session: dbSession });

      // Notify requester and warehouse
      await Notification.insertMany([
        {
          type: 'request_approved',
          requestId: reqDoc._id,
          recipientId: reqDoc.requesterId,
          message: 'Your request has been approved.',
          meta: { requestId: reqDoc._id },
        },
        {
          type: 'request_ready_for_fulfillment',
          requestId: reqDoc._id,
          recipientRole: 'warehouse',
          message: 'A request is ready to be fulfilled by warehouse.',
          meta: { requestId: reqDoc._id },
        },
      ], { session: dbSession, ordered: true });
    });

    return NextResponse.json({ message: 'Approved' }, { status: 200 });
  } catch (err: any) {
    const status = err?.status || (err?.code === 11000 ? 409 : 500);
    const msg = err?.status === 404 ? 'Not found' : err?.status === 409 ? 'Conflict' : 'Internal Server Error';
    if (status === 404) return NextResponse.json({ message: 'Not found' }, { status });
    if (status === 409) return NextResponse.json({ message: 'Conflict' }, { status });
    console.error('PATCH /api/admin/requests/[id]/approve error:', err);
    return NextResponse.json({ message: msg }, { status });
  } finally {
    dbSession.endSession();
  }
}
