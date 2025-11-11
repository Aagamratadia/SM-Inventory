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

// PATCH /api/warehouse/requests/[id]/fulfill
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;
  if (!session?.user?.id || !['admin', 'warehouse'].includes(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid request id' }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const fulfillmentNote = typeof body?.note === 'string' ? body.note : undefined;

  await dbConnect();
  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const reqDoc = await RequestModel.findById(id).session(dbSession);
      if (!reqDoc) throw Object.assign(new Error('Not found'), { status: 404 });
      if (reqDoc.status !== 'Approved') throw Object.assign(new Error('Not approved'), { status: 409 });

      // Guarded stock updates per item + append assignment history on Item
      for (const line of reqDoc.items) {
        const qty = Number(line.qty);
        const updated = await Item.updateOne(
          {
            _id: line.itemId,
            reserved: { $gte: qty },
            quantity: { $gte: qty },
          },
          {
            $inc: { reserved: -qty, quantity: -qty },
            $set: { assignedTo: reqDoc.requesterId },
            $push: {
              assignmentHistory: {
                user: reqDoc.requesterId,
                assignedAt: new Date(),
                action: 'assigned',
                quantity: qty,
                performedBy: new mongoose.Types.ObjectId(session.user.id),
              },
            },
          },
          { session: dbSession }
        );
        if (updated.modifiedCount !== 1) {
          throw Object.assign(new Error('Insufficient stock on fulfillment'), { status: 409, code: 'INSUFFICIENT' });
        }
      }

      // Resolve names for denormalization
      const requester = await User.findById(reqDoc.requesterId).session(dbSession);
      const fulfiller = await User.findById(session.user.id).session(dbSession);
      const assignedToName = requester?.name || 'User';
      const assignedByName = fulfiller?.name || 'Staff';

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

      // Update request status to Completed
      reqDoc.status = 'Completed' as any;
      reqDoc.fulfilledAt = new Date();
      reqDoc.fulfilledBy = new mongoose.Types.ObjectId(session.user.id);
      if (fulfillmentNote) reqDoc.fulfillmentNote = fulfillmentNote;
      await reqDoc.save({ session: dbSession });

      // Notify requester
      await Notification.create([
        {
          type: 'request_fulfilled',
          requestId: reqDoc._id,
          recipientId: reqDoc.requesterId,
          message: 'Your request has been fulfilled by warehouse.',
          meta: { requestId: reqDoc._id },
        },
      ], { session: dbSession });
    });

    return NextResponse.json({ message: 'Fulfilled' }, { status: 200 });
  } catch (err: any) {
    if (err?.status === 404) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    if (err?.code === 'INSUFFICIENT' || err?.status === 409) return NextResponse.json({ message: 'Insufficient stock on fulfillment' }, { status: 409 });
    console.error('PATCH /api/warehouse/requests/[id]/fulfill error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}
