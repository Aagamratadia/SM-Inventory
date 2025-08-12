import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Vendor from '@/models/Vendor';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';

// GET all vendors with their items
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const vendors = await Vendor.find({}).sort({ createdAt: -1 });
    const vendorNames = vendors.map((v) => v.name);

    // Fetch items for all vendors, matching by vendorname field in Item
    const items = await Item.find({ vendorname: { $in: vendorNames } }).select('name vendorname');

    const itemsByVendor: Record<string, string[]> = {};
    for (const item of items) {
      const vname = (item as any).vendorname as string;
      if (!itemsByVendor[vname]) itemsByVendor[vname] = [];
      itemsByVendor[vname].push((item as any).name as string);
    }

    const data = vendors.map((v) => ({
      _id: v._id,
      name: v.name,
      contactInfo: (v as any).contactInfo || '',
      items: itemsByVendor[v.name] || [],
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a vendor
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { name, contactInfo } = body || {};

    if (!name) {
      return NextResponse.json({ message: 'Vendor name is required' }, { status: 400 });
    }

    const existing = await Vendor.findOne({ name });
    if (existing) {
      return NextResponse.json({ message: 'A vendor with this name already exists.' }, { status: 409 });
    }

    const vendor = await Vendor.create({ name, contactInfo });
    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'A vendor with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
