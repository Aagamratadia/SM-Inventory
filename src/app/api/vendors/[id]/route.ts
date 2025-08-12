import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Vendor from '@/models/Vendor';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';

// GET a single vendor
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const vendor = await Vendor.findById(params.id);
    if (!vendor) {
      return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
    }
    return NextResponse.json(vendor, { status: 200 });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update a vendor
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { name, contactInfo } = body || {};

    const updated = await Vendor.findByIdAndUpdate(
      params.id,
      { name, contactInfo },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'A vendor with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a vendor
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const deleted = await Vendor.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
