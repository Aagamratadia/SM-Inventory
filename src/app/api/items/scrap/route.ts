import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';

export async function GET() {
  await dbConnect();
  try { await Item.syncIndexes(); } catch (e) { console.warn('Item.syncIndexes SCRAP GET warning:', e); }

  try {
    const scrapItems = await Item.find({ isScrap: true }).sort({ scrappedAt: -1 });
    return NextResponse.json(scrapItems);
  } catch (error) {
    console.error('Error fetching scrap items:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try { await Item.syncIndexes(); } catch (e) { console.warn('Item.syncIndexes SCRAP POST warning:', e); }

  try {
    const body = await request.json();

    const items: any[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [body];

    if (!items.length) {
      return NextResponse.json({ message: 'No items provided' }, { status: 400 });
    }

    const results = [] as any[];
    let singleDoc: any = null;
    for (const raw of items) {
      // Normalize and enforce scrap fields
      const name = raw?.name?.trim();
      const category = (raw?.category ?? raw?.name)?.trim();
      const vendorname = (raw?.vendorname ?? 'Unknown Vendor').trim();

      if (!name) {
        results.push({ ok: false, error: 'Missing name', input: raw });
        continue;
      }

      const payload: any = {
        category,
        name,
        vendorname,
        vendorContact: raw?.vendorContact ?? undefined,
        vendorEmail: raw?.vendorEmail ?? undefined,
        vendorAddress: raw?.vendorAddress ?? undefined,
        itemId: raw?.itemId ?? undefined,
        shape: raw?.shape ?? undefined,
        price: raw?.price ?? undefined,
        quantity: typeof raw?.quantity === 'number' ? raw.quantity : Number(raw?.quantity) || 0,
        totalQuantity: typeof raw?.quantity === 'number' ? raw.quantity : Number(raw?.quantity) || 0,
        notes: raw?.notes ?? undefined,
        isScrap: true,
        scrappedAt: raw?.scrappedAt ? new Date(raw.scrappedAt) : new Date(),
      };

      try {
        const doc = await Item.findOneAndUpdate(
          { category, name, isScrap: true },
          { $set: payload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        results.push({ ok: true, id: doc._id, name: doc.name });
        singleDoc = doc;
      } catch (e: any) {
        results.push({ ok: false, error: e?.message || String(e), input: raw });
      }
    }

    // If a single item was posted, return the full document directly for convenience
    if (items.length === 1 && results.length === 1 && results[0].ok && singleDoc) {
      return NextResponse.json(singleDoc);
    }
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error inserting scrap items:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
