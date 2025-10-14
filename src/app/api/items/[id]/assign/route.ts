import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params; // Item ID
  const { userId, quantity } = await req.json(); // User ID to assign to and quantity

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }
  const qty = Number(quantity ?? 1);
  if (!Number.isInteger(qty) || qty <= 0) {
    return NextResponse.json({ message: 'Quantity must be a positive integer' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Only admins may assign directly (until request/approval flow is live)
    const role = (session as any)?.user?.role;
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const itemToAssign = await Item.findById(id);
    if (!itemToAssign) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    const available = (itemToAssign.quantity ?? 0) - (itemToAssign.reserved ?? 0);
    if (available <= 0) {
      return NextResponse.json({ message: 'No stock available to assign' }, { status: 400 });
    }
    if (qty > available) {
      return NextResponse.json({ message: `Requested quantity ${qty} exceeds available stock ${available}` }, { status: 400 });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Ensure existing history entries have quantity for backward compatibility (mutate in-place)
    if (Array.isArray(itemToAssign.assignmentHistory)) {
      itemToAssign.assignmentHistory.forEach((entry: any) => {
        if (entry && entry.quantity == null) {
          entry.quantity = 1;
        }
      });
    }

    // Decrement on-hand stock and record assignment entry with quantity
    itemToAssign.quantity = (itemToAssign.quantity ?? 0) - qty;
    // If any stock is assigned, mark as assigned to the latest user for simplicity.
    // A more complex system would track assignments per user.
    itemToAssign.assignedTo = userId;
    itemToAssign.assignmentHistory.push({
      user: userId,
      assignedAt: new Date(),
      action: 'assigned',
      quantity: qty,
      performedBy: (session as any)?.user?.id || (session as any)?.user?._id,
    } as any);

    const updatedItem = await itemToAssign.save();

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('Error assigning item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
