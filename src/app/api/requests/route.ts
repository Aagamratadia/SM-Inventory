import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import Item from '@/models/Item';
import RequestModel from '@/models/Request';
import Notification from '@/models/Notification';

// GET /api/requests?mine=true&status=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine') === 'true';
    const status = searchParams.get('status') || undefined;

    const filter: any = {};
    if (mine) filter.requesterId = new mongoose.Types.ObjectId(session.user.id);
    if (status) filter.status = status;

    const requests = await RequestModel.find(filter).sort({ submittedAt: -1 });
    return NextResponse.json(requests, { status: 200 });
  } catch (err) {
    console.error('GET /api/requests error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/requests
// Body: { items: [{ itemId, qty }], note? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const itemsInput = Array.isArray(payload?.items) ? payload.items : [];
  if (itemsInput.length === 0) {
    return NextResponse.json({ message: 'At least one item is required' }, { status: 400 });
  }

  // Basic validation
  for (const line of itemsInput) {
    if (!line?.itemId || !mongoose.Types.ObjectId.isValid(line.itemId)) {
      return NextResponse.json({ message: 'Invalid itemId in items' }, { status: 400 });
    }
    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ message: 'Quantity must be a positive integer' }, { status: 400 });
    }
  }

  await dbConnect();
  const sessionDb = await mongoose.startSession();

  try {
    const shortages: Array<{ itemId: string; available: number; requested: number }> = [];

    await sessionDb.withTransaction(async () => {
      // Load items for denormalization
      const itemIds = itemsInput.map((i: any) => new mongoose.Types.ObjectId(i.itemId));
      const items = await Item.find({ _id: { $in: itemIds } }).session(sessionDb);
      const itemMap: Map<string, any> = new Map(
        items.map((it: any) => [String(it._id), it])
      );

      // Reserve atomically for each item
      for (const line of itemsInput) {
        const qty = Number(line.qty);
        const item = itemMap.get(line.itemId);
        if (!item) {
          throw new Error(`Item not found: ${line.itemId}`);
        }
        const available = (item.quantity || 0) - (item.reserved || 0);
        if (available < qty) {
          shortages.push({ itemId: line.itemId, available, requested: qty });
          continue; // still attempt others to report all shortages
        }

        const updated = await Item.findOneAndUpdate(
          {
            _id: item._id,
            $expr: {
              $gte: [
                { $subtract: [ { $ifNull: ['$quantity', 0] }, { $ifNull: ['$reserved', 0] } ] },
                qty,
              ],
            },
          },
          { $inc: { reserved: qty } },
          { new: true, session: sessionDb }
        );
        if (!updated) {
          // Another concurrent reservation may have consumed stock
          const latest = await Item.findById(item._id).session(sessionDb);
          const latestAvail = ((latest?.quantity || 0) - (latest?.reserved || 0));
          shortages.push({ itemId: line.itemId, available: latestAvail, requested: qty });
        }
      }

      if (shortages.length > 0) {
        // Abort the whole transaction by throwing; outer catch translates to 409
        throw Object.assign(new Error('Shortages'), { name: 'ShortageError' });
      }

      // Build denormalized items array
      const denormItems = itemsInput.map((line: any) => {
        const it: any = itemMap.get(String(line.itemId));
        if (!it) throw new Error('Item not found during denormalization');
        return {
          itemId: it._id as mongoose.Types.ObjectId,
          itemName: it.name,
          category: it.category,
          qty: Number(line.qty),
        };
      });

      // Create request
      const newReq = await RequestModel.create([
        {
          requesterId: new mongoose.Types.ObjectId(session.user.id),
          status: 'Pending',
          items: denormItems,
          note: typeof payload?.note === 'string' ? payload.note : undefined,
          submittedAt: new Date(),
        },
      ], { session: sessionDb });

      // Notify admins (in-app notification)
      await Notification.create([
        {
          type: 'request_submitted',
          requestId: newReq[0]._id,
          recipientRole: 'admin',
          message: `New request submitted by user ${session.user.id}`,
          meta: { requesterId: session.user.id, requestId: newReq[0]._id },
        },
      ], { session: sessionDb });
    });

    return NextResponse.json({ message: 'Request created' }, { status: 201 });
  } catch (err: any) {
    if (err?.name === 'ShortageError') {
      // Recompute shortages for response clarity (non-transactionally is acceptable for feedback)
      const detailed: Array<{ itemId: string; available: number; requested: number }> = [];
      for (const line of itemsInput) {
        const latest = await Item.findById(line.itemId);
        if (!latest) continue;
        const available = (latest.quantity || 0) - (latest.reserved || 0);
        const requested = Number(line.qty);
        if (available < requested) detailed.push({ itemId: String(line.itemId), available, requested });
      }
      return NextResponse.json({ message: 'Insufficient stock', shortages: detailed }, { status: 409 });
    }
    console.error('POST /api/requests error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    sessionDb.endSession();
  }
}
