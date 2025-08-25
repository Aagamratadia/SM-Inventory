import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import Vendor from '@/models/Vendor';

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

    // Normalize quantity fields
    const qty = body.quantity != null && body.quantity !== '' ? Number(body.quantity) : 0;
    const payload = {
      ...body,
      quantity: Number.isFinite(qty) && qty >= 0 ? qty : 0,
      totalQuantity: Number.isFinite(qty) && qty >= 0 ? qty : 0,
    };

    // If vendorname provided, ensure a Vendor exists; create if missing
    if (payload.vendorname && typeof payload.vendorname === 'string') {
      const vName = payload.vendorname.trim();
      if (vName) {
        try {
          await Vendor.findOneAndUpdate(
            { name: vName },
            {
              $setOnInsert: {
                name: vName,
                // Concatenate provided vendor contact details if any
                contactInfo: [payload.vendorContact, payload.vendorEmail, payload.vendorAddress]
                  .filter(Boolean)
                  .join(' | ') || undefined,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (e) {
          // Non-fatal for item creation; log and continue
          console.warn('Vendor upsert warning:', e);
        }
      }
    }

    const newItem = await Item.create(payload);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    if (error.code === 11000) { // Handle duplicate key error
        const msg = error?.keyPattern?.category && error?.keyPattern?.name
          ? 'An item with this name already exists in this category.'
          : 'An item with this name already exists.';
        return NextResponse.json({ message: msg }, { status: 409 });
    }
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
