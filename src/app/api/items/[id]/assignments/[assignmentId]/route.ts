import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';
import mongoose from 'mongoose';

export async function DELETE(req: NextRequest, { params }: { params: { id: string; assignmentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: itemId, assignmentId } = params;

  if (!mongoose.Types.ObjectId.isValid(itemId) || !mongoose.Types.ObjectId.isValid(assignmentId)) {
    return NextResponse.json({ message: 'Invalid item or assignment ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Only admins may delete assignment history entries (since it mutates stock)
    const role = (session as any)?.user?.role;
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const assignment = item.assignmentHistory.find(
      (h: any) => h._id.toString() === assignmentId
    );

    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    // Revert the quantity change, guard against negative stock
    if (assignment.action === 'assigned') {
      item.quantity += assignment.quantity;
    } else if (assignment.action === 'returned') {
      const newQty = (item.quantity ?? 0) - assignment.quantity;
      if (newQty < 0) {
        return NextResponse.json({ message: 'Reverting this return would make stock negative' }, { status: 409 });
      }
      item.quantity = newQty;
    }

    // Remove the assignment from history
    item.assignmentHistory = item.assignmentHistory.filter(
      (h: any) => h._id.toString() !== assignmentId
    );
    
    // Recalculate assignedTo status
    const assignedActions = item.assignmentHistory.filter((h: any) => h.action === 'assigned');
    if (assignedActions.length === 0) {
      item.assignedTo = null;
    } else {
      // Assign to the user of the most recent assignment
      item.assignedTo = assignedActions[assignedActions.length - 1].user;
    }

    const updatedItem = await item.save();

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
