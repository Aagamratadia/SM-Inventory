import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { name, email, role, password } = body;

  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updateData: any = { name, email, role };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Optional: Prevent admin from deleting themselves
    if (session.user.id === id) {
        return NextResponse.json({ message: 'You cannot delete your own account.' }, { status: 403 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
