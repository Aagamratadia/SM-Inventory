import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params; // Item ID
  const { quantity } = await req.json();

  try {
    await dbConnect();

    const itemToReturn = await Item.findById(id);
    if (!itemToReturn) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    const qty = Number(quantity ?? 1);
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ message: 'Quantity must be a positive integer' }, { status: 400 });
    }

    const currentAvailable = itemToReturn.quantity ?? 0;
    let total = itemToReturn.totalQuantity;
    let assignedOut = 0;
    if (typeof total === 'number' && Number.isFinite(total)) {
      assignedOut = Math.max(total - currentAvailable, 0);
    } else {
      // Infer assignedOut from history for legacy items
      const hist = Array.isArray(itemToReturn.assignmentHistory) ? itemToReturn.assignmentHistory : [];
      const netAssigned = hist.reduce((acc: number, h: any) => {
        const q = Number(h?.quantity ?? 1);
        if (h?.action === 'assigned') return acc + (Number.isFinite(q) ? q : 1);
        if (h?.action === 'returned') return acc - (Number.isFinite(q) ? q : 1);
        return acc;
      }, 0);
      assignedOut = Math.max(netAssigned, 0);
      total = currentAvailable + assignedOut;
      // store computed total to stabilize future operations (best-effort)
      itemToReturn.totalQuantity = total;
    }
    if (assignedOut <= 0) {
      return NextResponse.json({ message: 'No assigned stock to return' }, { status: 400 });
    }
    if (qty > assignedOut) {
      return NextResponse.json({ message: `Cannot return ${qty}; only ${assignedOut} assigned out` }, { status: 400 });
    }

    // Increase available stock by qty, capped at total
    itemToReturn.quantity = Math.min(currentAvailable + qty, total);
    const previousAssignee = itemToReturn.assignedTo;
    // Only clear assignedTo if all stock is now available
    if (itemToReturn.quantity === itemToReturn.totalQuantity) {
      itemToReturn.assignedTo = null;
    }
    itemToReturn.assignmentHistory.push({
      user: previousAssignee,
      returnedAt: new Date(),
      action: 'returned',
      quantity: qty,
      performedBy: (session as any)?.user?.id || (session as any)?.user?._id,
    } as any);

    const updatedItem = await itemToReturn.save();

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('Error returning item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
