import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import Vendor from '@/models/Vendor';
import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const qtyRaw = body?.quantity;
    const qtyNum = qtyRaw !== undefined && qtyRaw !== '' ? Number(qtyRaw) : NaN;
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      return NextResponse.json({ message: 'Quantity must be a positive number' }, { status: 400 });
    }
    const priceRaw = body?.price;
    const priceNum = priceRaw !== undefined && priceRaw !== '' ? Number(priceRaw) : undefined;
    if (priceRaw !== undefined && (priceNum === undefined || !Number.isFinite(priceNum) || priceNum < 0)) {
      return NextResponse.json({ message: 'Price must be a non-negative number' }, { status: 400 });
    }
    const note: string | undefined = body?.note || undefined;
    const vendorNameRaw: string | undefined = typeof body?.vendorName === 'string' ? body.vendorName.trim() : undefined;

    await dbConnect();

    const userId = (session as any)?.user?.id || (session as any)?.user?._id;

    // If vendorName provided, upsert vendor (non-fatal if fails)
    if (vendorNameRaw) {
      try {
        await Vendor.findOneAndUpdate(
          { name: vendorNameRaw },
          { $setOnInsert: { name: vendorNameRaw } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (e) {
        console.warn('Vendor upsert warning (add-stock):', e);
      }
    }
    const updateDoc: any = {
      $inc: { quantity: qtyNum, totalQuantity: qtyNum },
      $push: {
        stockAdditions: {
          quantity: qtyNum,
          addedAt: new Date(),
          performedBy: userId || undefined,
          priceAtAddition: priceNum,
          note,
          vendorName: vendorNameRaw,
        },
      },
    };
    if (priceNum !== undefined) {
      updateDoc.$set = { price: priceNum };
    }
    const updated = await Item.findByIdAndUpdate(
      id,
      updateDoc,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Error adding stock:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
