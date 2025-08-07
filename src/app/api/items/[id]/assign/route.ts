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
  const { userId } = await req.json(); // User ID to assign to

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const itemToAssign = await Item.findById(id);
    if (!itemToAssign) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    if (itemToAssign.assignedTo) {
      return NextResponse.json({ message: 'Item is already assigned' }, { status: 400 });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    itemToAssign.assignedTo = userId;
    itemToAssign.assignmentHistory.push({
      user: userId,
      assignedAt: new Date(),
      action: 'assigned',
    });

    const updatedItem = await itemToAssign.save();

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('Error assigning item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
