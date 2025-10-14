import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import RequestModel from '@/models/Request';
import Item from '@/models/Item';
import Notification from '@/models/Notification';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid request id' }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const decisionNote = typeof body?.reason === 'string' ? body.reason : undefined;

  await dbConnect();
  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const reqDoc = await RequestModel.findById(id).session(dbSession);
      if (!reqDoc) throw Object.assign(new Error('Not found'), { status: 404 });
      if (reqDoc.status !== 'Pending') throw Object.assign(new Error('Not pending'), { status: 409 });

      // Release reservations
      for (const line of reqDoc.items) {
        const qty = Number(line.qty);
        const updated = await Item.updateOne(
          {
            _id: line.itemId,
            reserved: { $gte: qty },
          },
          { $inc: { reserved: -qty } },
          { session: dbSession }
        );
        if (updated.modifiedCount !== 1) {
          throw Object.assign(new Error('Reservation mismatch'), { status: 409 });
        }
      }

      // Update request status
      reqDoc.status = 'Rejected';
      reqDoc.decisionAt = new Date();
      reqDoc.decisionBy = new mongoose.Types.ObjectId(session.user.id);
      if (decisionNote) reqDoc.decisionNote = decisionNote;
      await reqDoc.save({ session: dbSession });

      // Notify requester
      await Notification.create([
        {
          type: 'request_rejected',
          requestId: reqDoc._id,
          recipientId: reqDoc.requesterId,
          message: decisionNote ? `Your request was rejected: ${decisionNote}` : 'Your request was rejected.',
          meta: { requestId: reqDoc._id },
        },
      ], { session: dbSession });
    });

    return NextResponse.json({ message: 'Rejected' }, { status: 200 });
  } catch (err: any) {
    const status = err?.status || 500;
    if (status === 404) return NextResponse.json({ message: 'Not found' }, { status });
    if (status === 409) return NextResponse.json({ message: 'Conflict' }, { status });
    console.error('PATCH /api/admin/requests/[id]/reject error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
