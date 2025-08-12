import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { auth as authOptions } from '@/auth.config';

// Helper to compute total from history
function computeTotalFromHistory(item: any): number {
  const available = Number(item?.quantity ?? 0);
  const hist = Array.isArray(item?.assignmentHistory) ? item.assignmentHistory : [];
  const netAssigned = hist.reduce((acc: number, h: any) => {
    const q = Number(h?.quantity ?? 1);
    if (h?.action === 'assigned') return acc + (Number.isFinite(q) ? q : 1);
    if (h?.action === 'returned') return acc - (Number.isFinite(q) ? q : 1);
    return acc;
  }, 0);
  return available + Math.max(netAssigned, 0);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const items = await Item.find({});
    let updatedCount = 0;

    const updates = items.map(async (item) => {
      const correctTotal = computeTotalFromHistory(item);
      if (item.totalQuantity !== correctTotal) {
        item.totalQuantity = correctTotal;
        await item.save();
        updatedCount++;
      }
    });

    await Promise.all(updates);

    return NextResponse.json({
      message: `Consistency check complete. ${updatedCount} items updated.`,
      updatedCount,
    });
  } catch (error) {
    console.error('Error fixing item totals:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
