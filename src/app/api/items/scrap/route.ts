import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';

export async function GET() {
  await dbConnect();

  try {
    const scrapItems = await Item.find({ isScrap: true }).sort({ scrappedAt: -1 });
    return NextResponse.json(scrapItems);
  } catch (error) {
    console.error('Error fetching scrap items:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
