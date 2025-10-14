import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import RequestModel from '@/models/Request';
import Item from '@/models/Item';
import Assignment from '@/models/Assignment';
import Notification from '@/models/Notification';
import User from '@/models/User';

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
    let requesterId: string | undefined;
    await dbSession.withTransaction(async () => {
      const reqDoc = await RequestModel.findById(id).session(dbSession);
      if (!reqDoc) throw Object.assign(new Error('Not found'), { status: 404 });
      if (reqDoc.status !== 'Pending') throw Object.assign(new Error('Not pending'), { status: 409 });

      requesterId = reqDoc.requesterId.toString();

      // Guarded stock updates per item
      for (const line of reqDoc.items) {
        const qty = Number(line.qty);
        const updated = await Item.updateOne(
          {
            _id: line.itemId,
            reserved: { $gte: qty },
            quantity: { $gte: qty },
          },
          { $inc: { reserved: -qty, quantity: -qty } },
          { session: dbSession }
        );
        if (updated.modifiedCount !== 1) {
          throw Object.assign(new Error('Insufficient stock on approval'), { status: 409, code: 'INSUFFICIENT' });
        }
      }

      // Resolve names for denormalization
      const requester = await User.findById(reqDoc.requesterId).session(dbSession);
      const admin = await User.findById(session.user.id).session(dbSession);
      const assignedToName = requester?.name || 'User';
      const assignedByName = admin?.name || 'Admin';

      // Create assignments for each item
      const assignmentDocs = reqDoc.items.map((line) => ({
        requestId: reqDoc._id,
        itemId: line.itemId,
        qty: line.qty,
        assignedToId: reqDoc.requesterId,
        assignedToName,
        assignedById: new mongoose.Types.ObjectId(session.user.id),
        assignedByName,
        assignedAt: new Date(),
      }));
      await Assignment.insertMany(assignmentDocs, { session: dbSession });

      // Update request status
      reqDoc.status = 'Approved';
      reqDoc.decisionAt = new Date();
      reqDoc.decisionBy = new mongoose.Types.ObjectId(session.user.id);
      await reqDoc.save({ session: dbSession });

      // Notify requester
      await Notification.create([
        {
          type: 'request_approved',
          requestId: reqDoc._id,
          recipientId: reqDoc.requesterId,
          message: 'Your request has been approved.',
          meta: { requestId: reqDoc._id },
        },
      ], { session: dbSession });
    });

    return NextResponse.json({ message: 'Approved' }, { status: 200 });
  } catch (err: any) {
    const status = err?.status || (err?.code === 11000 ? 409 : 500);
    const msg = err?.status === 404 ? 'Not found' : err?.status === 409 ? 'Conflict' : 'Internal Server Error';
    if (err?.code === 'INSUFFICIENT') {
      return NextResponse.json({ message: 'Insufficient stock on approval' }, { status: 409 });
    }
    if (status === 404) return NextResponse.json({ message: 'Not found' }, { status });
    if (status === 409) return NextResponse.json({ message: 'Conflict' }, { status });
    console.error('PATCH /api/admin/requests/[id]/approve error:', err);
    return NextResponse.json({ message: msg }, { status });
  } finally {
    dbSession.endSession();
  }
}
