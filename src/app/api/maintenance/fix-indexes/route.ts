import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Secure this endpoint: require an authenticated session (optional: add role checks if you have roles)
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    const coll = db.collection('items');

    const result: any = { dropped: null, created: null, indexes: [] };

    // List indexes
    const indexes = await coll.indexes();
    result.indexes = indexes;

    // Drop legacy unique category index if present
    const legacy = indexes.find((i: any) => i.name === 'category_1' && i.unique);
    if (legacy) {
      try {
        await coll.dropIndex('category_1');
        result.dropped = 'category_1';
      } catch (e: any) {
        result.dropped = { error: e?.message || String(e) };
      }
    }

    // Ensure compound unique index exists
    const compoundName = 'category_1_name_1';
    const hasCompound = indexes.some((i: any) => i.name === compoundName);
    if (!hasCompound) {
      try {
        await coll.createIndex({ category: 1, name: 1 }, { name: compoundName, unique: true, background: true });
        result.created = compoundName;
      } catch (e: any) {
        result.created = { error: e?.message || String(e) };
      }
    }

    // Return latest indexes
    result.indexes = await coll.indexes();

    return NextResponse.json({ message: 'OK', result }, { status: 200 });
  } catch (error: any) {
    console.error('fix-indexes error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
