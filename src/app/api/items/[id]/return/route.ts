import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params; // Item ID

  try {
    await dbConnect();

    const itemToReturn = await Item.findById(id);
    if (!itemToReturn) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    if (!itemToReturn.assignedTo) {
      return NextResponse.json({ message: 'Item is not currently assigned' }, { status: 400 });
    }

    const returningUser = itemToReturn.assignedTo;
    itemToReturn.assignedTo = undefined;
    itemToReturn.assignmentHistory.push({
      user: returningUser,
      returnedAt: new Date(),
      action: 'returned',
    });

    const updatedItem = await itemToReturn.save();

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('Error returning item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
