import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await dbConnect();
    const item = await Item.findById(id)
      .populate('assignedTo', 'name email')
      .populate('assignmentHistory.user', 'name email')
      .populate('stockAdditions.performedBy', 'name email');
      
    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Update an item
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();

  try {
    await dbConnect();
    const updatedItem = await Item.findByIdAndUpdate(id, body, { new: true });
    if (!updatedItem) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete an item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await dbConnect();
    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
