import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth as authOptions } from '@/auth.config';
import dbConnect from '@/lib/dbConnect';
import Reconciliation from '@/models/Reconciliation';
import Item from '@/models/Item';
import mongoose from 'mongoose';
import { generateReport, ReportFilters } from '@/lib/reportBuilders';

const DEFAULT_LIMIT = 200;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session;
}

function parseFilters(searchParams: URLSearchParams): ReportFilters {
  const filters: ReportFilters = {
    department: searchParams.get('department') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
  };

  const itemIds = searchParams.get('itemIds');
  if (itemIds) {
    filters.itemIds = itemIds.split(',').map((id) => id.trim()).filter(Boolean);
  }

  return filters;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const filters = parseFilters(new URL(req.url).searchParams);
    const result = await generateReport('clarification', filters, { limit: DEFAULT_LIMIT, fullExport: false });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/reconciliations error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await requireAdmin();

    const body = await req.json();
    const { itemId, countedQty, department, countedAt, notes } = body || {};

    if (!itemId || countedQty === undefined || countedQty === null || countedQty < 0) {
      return NextResponse.json({ message: 'itemId and countedQty are required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ message: 'Invalid itemId' }, { status: 400 });
    }

    const item = await Item.findById(itemId).select('quantity category name itemId');
    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    const systemQty = item.quantity ?? 0;
    const delta = countedQty - systemQty;

    const record = await Reconciliation.create({
      item: item._id,
      countedQty,
      systemQty,
      delta,
      department: department?.trim() || undefined,
      countedAt: countedAt ? new Date(countedAt) : new Date(),
      countedBy: new mongoose.Types.ObjectId((session.user as any).id),
      notes: notes?.trim() || undefined,
    });

    return NextResponse.json({ id: record._id.toString(), delta }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/reconciliations error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
