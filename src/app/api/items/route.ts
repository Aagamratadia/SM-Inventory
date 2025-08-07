import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET all items
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const items = await Item.find({}).populate('assignedTo', 'name').sort({ createdAt: -1 });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST a new item
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    
    // Basic validation
    if (!body.name) {
        return NextResponse.json({ message: 'Item name is required' }, { status: 400 });
    }

    const newItem = await Item.create(body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    if (error.code === 11000) { // Handle duplicate key error for 'name'
        return NextResponse.json({ message: 'An item with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
