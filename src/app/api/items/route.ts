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
    try { await Item.syncIndexes(); } catch (e) { console.warn('Item.syncIndexes GET warning:', e); }
    // Exclude scrap items from main inventory list
    const items = await Item.find({ isScrap: { $ne: true } })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
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
    try { await Item.syncIndexes(); } catch (e) { console.warn('Item.syncIndexes POST warning:', e); }
    const body = await request.json();
    
    // Basic validation
    if (!body.name) {
        return NextResponse.json({ message: 'Item name is required' }, { status: 400 });
    }
    // Enforce required fields: quantity and price
    const qtyRaw = body.quantity;
    const priceRaw = body.price;
    const qtyNum = qtyRaw !== undefined && qtyRaw !== '' ? Number(qtyRaw) : NaN;
    const priceNum = priceRaw !== undefined && priceRaw !== '' ? Number(priceRaw) : NaN;
    if (!Number.isFinite(qtyNum)) {
      return NextResponse.json({ message: 'Quantity is required and must be a number' }, { status: 400 });
    }
    if (!Number.isFinite(priceNum)) {
      return NextResponse.json({ message: 'Price is required and must be a number' }, { status: 400 });
    }
    if (qtyNum < 0) {
      return NextResponse.json({ message: 'Quantity cannot be negative' }, { status: 400 });
    }
    if (priceNum < 0) {
      return NextResponse.json({ message: 'Price cannot be negative' }, { status: 400 });
    }

    // Normalize payload
    const payload = {
      ...body,
      quantity: qtyNum,
      totalQuantity: qtyNum,
      price: priceNum,
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
