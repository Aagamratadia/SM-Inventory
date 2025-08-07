import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import * as xlsx from 'xlsx';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.arrayBuffer();
    const workbook = xlsx.read(data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(worksheet);

    if (json.length === 0) {
      return NextResponse.json({ message: 'Excel file is empty or invalid' }, { status: 400 });
    }

    await dbConnect();

    // Optional: Add more robust validation here
    const itemsToInsert = json.map((row: any) => ({
      name: row.name,
      itemId: row.itemId,
      shape: row.shape,
      carat: row.carat,
      clarity: row.clarity,
      color: row.color,
      price: row.price,
      notes: row.notes,
    }));

    const result = await Item.insertMany(itemsToInsert, { ordered: false }); // ordered:false continues on error

    return NextResponse.json(
      { 
        message: 'Import successful',
        insertedCount: result.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error importing items:', error);
    if (error.code === 11000) {
        return NextResponse.json({ message: 'Import failed due to duplicate item names or IDs. Please check the Excel file for duplicates.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
