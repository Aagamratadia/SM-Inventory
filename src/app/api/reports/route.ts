'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { auth as authOptions } from '@/auth.config';
import { generateReport, getReportContext, ReportFilters, ReportResult, ReportType } from '@/lib/reportBuilders';
import * as XLSX from 'xlsx';

const MAX_PREVIEW_ROWS = 500;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session;
}

function parseBody(requestBody: any): { reportType: ReportType; filters: ReportFilters; fullExport?: boolean } {
  const { reportType, filters, fullExport } = requestBody || {};
  if (!reportType) {
    throw new Error('Missing reportType');
  }
  return { reportType, filters: filters || {}, fullExport: Boolean(fullExport) };
}

function buildWorkbook(result: ReportResult) {
  const worksheetData = [result.columns.map((c) => c.header)];
  result.rows.forEach((row) => {
    worksheetData.push(result.columns.map((c) => row[c.key] ?? ''));
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Report');

  return workbook;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const url = new URL(req.url);
    const mode = url.searchParams.get('mode');

    if (mode === 'context') {
      const context = await getReportContext();
      return NextResponse.json(context, { status: 200 });
    }

    const reportType = url.searchParams.get('reportType') as ReportType | null;
    if (!reportType) {
      return NextResponse.json({ message: 'Missing reportType' }, { status: 400 });
    }

    const filters: ReportFilters = {
      category: url.searchParams.get('category') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      department: url.searchParams.get('department') ?? undefined,
      userId: url.searchParams.get('userId') ?? undefined,
      performedBy: url.searchParams.get('performedBy') ?? undefined,
      action: (url.searchParams.get('action') as 'assigned' | 'returned') ?? undefined,
      dateFrom: url.searchParams.get('dateFrom') ?? undefined,
      dateTo: url.searchParams.get('dateTo') ?? undefined,
      includeStockAdditions: url.searchParams.get('includeStockAdditions') === 'true',
    };

    const itemIdsParam = url.searchParams.get('itemIds');
    if (itemIdsParam) {
      filters.itemIds = itemIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
    }

    const fullExport = url.searchParams.get('fullExport') === 'true';

    const result = await generateReport(reportType, filters, {
      limit: MAX_PREVIEW_ROWS,
      fullExport,
    });

    if (!fullExport) {
      return NextResponse.json(result, { status: 200 });
    }

    const workbook = buildWorkbook(result);
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${result.fileName || 'inventory_report'}.xlsx"`);

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: any) {
    console.error('GET /api/reports error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    await requireAdmin();

    const body = await request.json();
    const { reportType, filters, fullExport } = parseBody(body);

    const result = await generateReport(reportType, filters, {
      limit: MAX_PREVIEW_ROWS,
      fullExport,
    });

    if (!fullExport) {
      return NextResponse.json(result, { status: 200 });
    }

    const workbook = buildWorkbook(result);
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${result.fileName || 'inventory_report'}.xlsx"`);

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error: any) {
    console.error('POST /api/reports error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
