import mongoose from 'mongoose';
import Item, { IItem } from '@/models/Item';
import Reconciliation from '@/models/Reconciliation';
import User from '@/models/User';

export type ReportType =
  | 'inventorySnapshot'
  | 'departmentInventory'
  | 'monthlyTally'
  | 'assignmentHistory'
  | 'clarification';

export interface ReportFilters {
  itemIds?: string[];
  category?: string;
  search?: string;
  department?: string;
  userId?: string;
  performedBy?: string;
  action?: 'assigned' | 'returned';
  dateFrom?: string;
  dateTo?: string;
  includeStockAdditions?: boolean;
}

export interface ReportResult {
  columns: { key: string; header: string }[];
  rows: Record<string, any>[];
  fileName: string;
}

interface GenerateOptions {
  limit?: number;
  fullExport?: boolean;
}

const DEFAULT_LIMIT = 500;

const toObjectId = (value?: string | null) => {
  if (!value) return undefined;
  if (!mongoose.Types.ObjectId.isValid(value)) return undefined;
  return new mongoose.Types.ObjectId(value);
};

const buildDateRange = (from?: string, to?: string) => {
  if (!from && !to) return undefined;
  const range: { $gte?: Date; $lte?: Date } = {};
  if (from) range.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return range;
};

const buildRegex = (value?: string) => (value ? new RegExp(value, 'i') : undefined);

const toISOString = (value?: Date | string | null) =>
  value ? new Date(value).toISOString() : '';

async function fetchUserMap(userIds: mongoose.Types.ObjectId[]) {
  if (!userIds.length) return new Map<string, { name: string; department?: string }>();
  const users = await User.find({ _id: { $in: userIds } }, 'name department').lean();
  const map = new Map<string, { name: string; department?: string }>();
  users.forEach((u: any) => {
    map.set(u._id.toString(), { name: u.name, department: u.department || undefined });
  });
  return map;
}

async function buildInventorySnapshot(filters: ReportFilters, options: GenerateOptions): Promise<ReportResult> {
  const { includeStockAdditions } = filters;
  const query: any = { isScrap: { $ne: true } };

  if (filters.itemIds?.length) {
    const ids = filters.itemIds.map(toObjectId).filter(Boolean) as mongoose.Types.ObjectId[];
    if (ids.length) query._id = { $in: ids };
  }

  if (filters.category) {
    query.category = buildRegex(filters.category);
  }

  if (filters.search) {
    query.$or = [
      { name: buildRegex(filters.search) },
      { itemId: buildRegex(filters.search) },
      { vendorname: buildRegex(filters.search) },
    ];
  }

  const fields = ['name', 'category', 'quantity', 'totalQuantity', 'reserved', 'vendorname', 'notes', 'updatedAt', 'itemId', 'price'];
  if (includeStockAdditions) fields.push('stockAdditions');

  let cursor = Item.find(query).select(fields.join(' ')).sort({ name: 1 });
  if (!options.fullExport) {
    cursor = cursor.limit(options.limit ?? DEFAULT_LIMIT);
  }

  const items = (await cursor.lean()) as (IItem & { stockAdditions?: any[] })[];

  const userIdSet = new Set<string>();
  if (includeStockAdditions) {
    items.forEach((item: any) => {
      item.stockAdditions?.forEach((addition: any) => {
        if (addition.performedBy) {
          userIdSet.add(addition.performedBy.toString());
        }
      });
    });
  }

  const userMap = await fetchUserMap(Array.from(userIdSet).map((id) => new mongoose.Types.ObjectId(id)));

  const columns = [
    { key: 'recordType', header: 'Record Type' },
    { key: 'itemName', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    { key: 'itemId', header: 'Item ID' },
    { key: 'vendor', header: 'Vendor' },
    { key: 'quantity', header: 'Available Qty' },
    { key: 'totalQuantity', header: 'Total Qty' },
    { key: 'reserved', header: 'Reserved Qty' },
    { key: 'price', header: 'Price' },
    { key: 'action', header: 'Action' },
    { key: 'quantityDelta', header: 'Qty Delta' },
    { key: 'actor', header: 'Performed By' },
    { key: 'date', header: 'Date' },
    { key: 'notes', header: 'Notes' },
  ];

  const rows: Record<string, any>[] = [];

  items.forEach((item: any) => {
    rows.push({
      recordType: 'snapshot',
      itemName: item.name,
      category: item.category,
      itemId: item.itemId || '',
      vendor: item.vendorname || '',
      quantity: item.quantity,
      totalQuantity: item.totalQuantity,
      reserved: item.reserved,
      price: item.price ?? '',
      action: '',
      quantityDelta: '',
      actor: '',
      date: toISOString(item.updatedAt),
      notes: item.notes || '',
    });

    if (includeStockAdditions) {
      (item.stockAdditions || []).forEach((addition: any) => {
        const actor = addition.performedBy ? userMap.get(addition.performedBy.toString()) : undefined;
        rows.push({
          recordType: 'stockAddition',
          itemName: item.name,
          category: item.category,
          itemId: item.itemId || '',
          vendor: addition.vendorName || item.vendorname || '',
          quantity: item.quantity,
          totalQuantity: item.totalQuantity,
          reserved: item.reserved,
          price: addition.priceAtAddition ?? item.price ?? '',
          action: 'Added',
          quantityDelta: addition.quantity,
          actor: actor?.name || '',
          date: toISOString(addition.addedAt),
          notes: addition.note || '',
        });
      });
    }
  });

  return {
    columns,
    rows,
    fileName: 'inventory_snapshot',
  };
}

async function buildDepartmentInventory(filters: ReportFilters, options: GenerateOptions): Promise<ReportResult> {
  const query: any = { isScrap: { $ne: true } };

  if (filters.itemIds?.length) {
    const ids = filters.itemIds.map(toObjectId).filter(Boolean) as mongoose.Types.ObjectId[];
    if (ids.length) query._id = { $in: ids };
  }

  if (filters.category) {
    query.category = buildRegex(filters.category);
  }

  const fields = ['name', 'category', 'quantity', 'totalQuantity', 'reserved', 'assignmentHistory'];
  let cursor = Item.find(query).select(fields.join(' ')).sort({ name: 1 });
  if (!options.fullExport) {
    cursor = cursor.limit(options.limit ?? DEFAULT_LIMIT);
  }
  const items = (await cursor.lean()) as any[];

  const userIds = new Set<string>();
  items.forEach((item) => {
    (item.assignmentHistory || []).forEach((hist: any) => {
      if (hist.user) userIds.add(hist.user.toString());
      if (hist.performedBy) userIds.add(hist.performedBy.toString());
    });
  });

  const userMap = await fetchUserMap(Array.from(userIds).map((id) => new mongoose.Types.ObjectId(id)));

  const targetDepartment = filters.department?.trim();

  const columns = [
    { key: 'department', header: 'Department' },
    { key: 'itemName', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    { key: 'assignedQty', header: 'Assigned Qty' },
    { key: 'availableQty', header: 'Available Qty' },
    { key: 'reservedQty', header: 'Reserved Qty' },
    { key: 'lastActionAt', header: 'Last Action Date' },
  ];

  const rows: Record<string, any>[] = [];

  items.forEach((item) => {
    const deptMap = new Map<string, { assigned: number; lastAction?: Date }>();

    (item.assignmentHistory || []).forEach((hist: any) => {
      const userKey = hist.user ? hist.user.toString() : undefined;
      const userInfo = userKey ? userMap.get(userKey) : undefined;
      const dept = userInfo?.department || 'Unassigned';

      if (targetDepartment && dept.toLowerCase() !== targetDepartment.toLowerCase()) {
        return;
      }

      const entry = deptMap.get(dept) || { assigned: 0, lastAction: undefined };
      if (hist.action === 'assigned') {
        entry.assigned += hist.quantity || 0;
        if (hist.assignedAt) {
          entry.lastAction = entry.lastAction && entry.lastAction > hist.assignedAt ? entry.lastAction : hist.assignedAt;
        }
      } else if (hist.action === 'returned') {
        entry.assigned -= hist.quantity || 0;
        if (hist.returnedAt) {
          entry.lastAction = entry.lastAction && entry.lastAction > hist.returnedAt ? entry.lastAction : hist.returnedAt;
        }
      }
      deptMap.set(dept, entry);
    });

    deptMap.forEach((data, dept) => {
      rows.push({
        department: dept,
        itemName: item.name,
        category: item.category,
        assignedQty: data.assigned,
        availableQty: item.quantity,
        reservedQty: item.reserved,
        lastActionAt: toISOString(data.lastAction),
      });
    });

    if (deptMap.size === 0 && targetDepartment) {
      rows.push({
        department: targetDepartment,
        itemName: item.name,
        category: item.category,
        assignedQty: 0,
        availableQty: item.quantity,
        reservedQty: item.reserved,
        lastActionAt: '',
      });
    }
  });

  return {
    columns,
    rows,
    fileName: 'department_inventory',
  };
}

async function buildMonthlyTally(filters: ReportFilters, options: GenerateOptions): Promise<ReportResult> {
  const query: any = { isScrap: { $ne: true } };
  if (filters.itemIds?.length) {
    const ids = filters.itemIds.map(toObjectId).filter(Boolean) as mongoose.Types.ObjectId[];
    if (ids.length) query._id = { $in: ids };
  }
  if (filters.category) {
    query.category = buildRegex(filters.category);
  }

  const fields = ['name', 'category', 'vendorname', 'stockAdditions', 'assignmentHistory', 'scrappedAt', 'isScrap'];
  let cursor = Item.find(query).select(fields.join(' ')).sort({ name: 1 });
  if (!options.fullExport) {
    cursor = cursor.limit(options.limit ?? DEFAULT_LIMIT);
  }
  const items = (await cursor.lean()) as any[];

  const dateRange = buildDateRange(filters.dateFrom, filters.dateTo);

  const userIds = new Set<string>();
  items.forEach((item) => {
    (item.stockAdditions || []).forEach((addition: any) => {
      if (addition.performedBy) userIds.add(addition.performedBy.toString());
    });
    (item.assignmentHistory || []).forEach((hist: any) => {
      if (hist.user) userIds.add(hist.user.toString());
      if (hist.performedBy) userIds.add(hist.performedBy.toString());
    });
  });

  const userMap = await fetchUserMap(Array.from(userIds).map((id) => new mongoose.Types.ObjectId(id)));
  const rows: Record<string, any>[] = [];
  const targetDepartment = filters.department?.trim().toLowerCase();

  items.forEach((item) => {
    (item.stockAdditions || []).forEach((addition: any) => {
      if (dateRange) {
        const date = addition.addedAt ? new Date(addition.addedAt) : undefined;
        if (date) {
          if (dateRange.$gte && date < dateRange.$gte) return;
          if (dateRange.$lte && date > dateRange.$lte) return;
        }
      }

      const actorInfo = addition.performedBy ? userMap.get(addition.performedBy.toString()) : undefined;
      rows.push({
        itemName: item.name,
        category: item.category,
        action: 'Added',
        quantity: addition.quantity,
        date: toISOString(addition.addedAt),
        actor: actorInfo?.name || '',
        department: actorInfo?.department || '',
        source: addition.vendorName || item.vendorname || '',
        notes: addition.note || '',
      });
    });

    (item.assignmentHistory || []).forEach((hist: any) => {
      let relevantDate: Date | undefined;
      if (hist.action === 'assigned') relevantDate = hist.assignedAt ? new Date(hist.assignedAt) : undefined;
      if (hist.action === 'returned') relevantDate = hist.returnedAt ? new Date(hist.returnedAt) : undefined;

      if (dateRange && relevantDate) {
        if (dateRange.$gte && relevantDate < dateRange.$gte) return;
        if (dateRange.$lte && relevantDate > dateRange.$lte) return;
      }

      const userInfo = hist.user ? userMap.get(hist.user.toString()) : undefined;
      if (targetDepartment && userInfo?.department?.toLowerCase() !== targetDepartment) {
        return;
      }

      const actorInfo = hist.performedBy ? userMap.get(hist.performedBy.toString()) : undefined;
      rows.push({
        itemName: item.name,
        category: item.category,
        action: hist.action === 'assigned' ? 'Assigned' : 'Returned',
        quantity: hist.quantity,
        date: toISOString(hist.action === 'assigned' ? hist.assignedAt : hist.returnedAt),
        actor: actorInfo?.name || '',
        department: userInfo?.department || '',
        source: userInfo?.name || '',
        notes: '',
      });
    });

    if (item.isScrap && item.scrappedAt) {
      const scrapDate = new Date(item.scrappedAt);
      if (!dateRange || ((dateRange.$gte ? scrapDate >= dateRange.$gte : true) && (dateRange.$lte ? scrapDate <= dateRange.$lte : true))) {
        rows.push({
          itemName: item.name,
          category: item.category,
          action: 'Scrap',
          quantity: '',
          date: toISOString(item.scrappedAt),
          actor: '',
          department: '',
          source: '',
          notes: '',
        });
      }
    }
  });

  rows.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const limitedRows = options.fullExport ? rows : rows.slice(0, options.limit ?? DEFAULT_LIMIT);

  const columns = [
    { key: 'itemName', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    { key: 'action', header: 'Action' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'date', header: 'Date' },
    { key: 'actor', header: 'Actor' },
    { key: 'department', header: 'Department' },
    { key: 'source', header: 'Source' },
    { key: 'notes', header: 'Notes' },
  ];

  return {
    columns,
    rows: limitedRows,
    fileName: 'monthly_tally',
  };
}

async function buildAssignmentHistory(filters: ReportFilters, options: GenerateOptions): Promise<ReportResult> {
  const itemMatch: any[] = [{ isScrap: { $ne: true } }];

  if (filters.itemIds?.length) {
    const ids = filters.itemIds.map(toObjectId).filter(Boolean) as mongoose.Types.ObjectId[];
    if (ids.length) itemMatch.push({ _id: { $in: ids } });
  }

  if (filters.category) {
    itemMatch.push({ category: buildRegex(filters.category) });
  }

  if (filters.search) {
    const regex = buildRegex(filters.search);
    itemMatch.push({ $or: [{ name: regex }, { itemId: regex }] });
  }

  const pipeline: any[] = [];
  if (itemMatch.length) {
    pipeline.push({ $match: { $and: itemMatch } });
  }

  pipeline.push({ $unwind: '$assignmentHistory' });

  const histMatch: any = {};
  if (filters.action) histMatch['assignmentHistory.action'] = filters.action;
  if (filters.userId) {
    const userId = toObjectId(filters.userId);
    if (userId) histMatch['assignmentHistory.user'] = userId;
  }
  if (filters.performedBy) {
    const actorId = toObjectId(filters.performedBy);
    if (actorId) histMatch['assignmentHistory.performedBy'] = actorId;
  }
  const dateRange = buildDateRange(filters.dateFrom, filters.dateTo);
  if (dateRange) {
    histMatch.$or = [
      { 'assignmentHistory.assignedAt': dateRange },
      { 'assignmentHistory.returnedAt': dateRange },
    ];
  }

  if (Object.keys(histMatch).length) {
    pipeline.push({ $match: histMatch });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'assignmentHistory.user',
        foreignField: '_id',
        as: 'assignedUser',
      },
    },
    { $unwind: { path: '$assignedUser', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignmentHistory.performedBy',
        foreignField: '_id',
        as: 'actor',
      },
    },
    { $unwind: { path: '$actor', preserveNullAndEmptyArrays: true } },
  );

  if (filters.department) {
    pipeline.push({
      $match: {
        $or: [
          { 'assignedUser.department': buildRegex(filters.department) },
          { 'actor.department': buildRegex(filters.department) },
        ],
      },
    });
  }

  pipeline.push(
    {
      $project: {
        _id: 0,
        itemId: '$_id',
        itemName: '$name',
        category: '$category',
        action: '$assignmentHistory.action',
        quantity: '$assignmentHistory.quantity',
        assignedAt: '$assignmentHistory.assignedAt',
        returnedAt: '$assignmentHistory.returnedAt',
        assignedToName: '$assignedUser.name',
        assignedToDepartment: '$assignedUser.department',
        actorName: '$actor.name',
        actorDepartment: '$actor.department',
      },
    },
    { $sort: { assignedAt: -1, returnedAt: -1 } },
  );

  if (!options.fullExport) {
    pipeline.push({ $limit: options.limit ?? DEFAULT_LIMIT });
  }

  const results = await Item.aggregate(pipeline);

  const rows = results.map((r: any) => ({
    itemName: r.itemName,
    category: r.category,
    action: r.action === 'assigned' ? 'Assigned' : 'Returned',
    quantity: r.quantity,
    assignedAt: toISOString(r.assignedAt),
    returnedAt: toISOString(r.returnedAt),
    assignedTo: r.assignedToName || '',
    department: r.assignedToDepartment || '',
    performedBy: r.actorName || '',
    performedByDepartment: r.actorDepartment || '',
  }));

  const columns = [
    { key: 'itemName', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    { key: 'action', header: 'Action' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'assignedAt', header: 'Assigned At' },
    { key: 'returnedAt', header: 'Returned At' },
    { key: 'assignedTo', header: 'Assigned To' },
    { key: 'department', header: 'Department' },
    { key: 'performedBy', header: 'Performed By' },
    { key: 'performedByDepartment', header: 'Actor Department' },
  ];

  return {
    columns,
    rows,
    fileName: 'assignment_history',
  };
}

async function buildClarification(filters: ReportFilters, options: GenerateOptions): Promise<ReportResult> {
  const query: any = {};
  if (filters.itemIds?.length) {
    const ids = filters.itemIds.map(toObjectId).filter(Boolean) as mongoose.Types.ObjectId[];
    if (ids.length) query.item = { $in: ids };
  }
  if (filters.department) {
    query.department = buildRegex(filters.department);
  }
  const dateRange = buildDateRange(filters.dateFrom, filters.dateTo);
  if (dateRange) query.countedAt = dateRange;

  let cursor = Reconciliation.find(query)
    .sort({ countedAt: -1 })
    .populate('item', 'name category itemId')
    .populate('countedBy', 'name department');

  if (!options.fullExport) {
    cursor = cursor.limit(options.limit ?? DEFAULT_LIMIT);
  }

  const records = await cursor.lean();

  const rows = records.map((rec: any) => ({
    itemName: rec.item?.name || '',
    category: rec.item?.category || '',
    itemId: rec.item?.itemId || '',
    countedQty: rec.countedQty,
    systemQty: rec.systemQty,
    delta: rec.delta,
    department: rec.department || rec.countedBy?.department || '',
    countedAt: toISOString(rec.countedAt),
    countedBy: rec.countedBy?.name || '',
    notes: rec.notes || '',
  }));

  const columns = [
    { key: 'itemName', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    { key: 'itemId', header: 'Item ID' },
    { key: 'countedQty', header: 'Counted Qty' },
    { key: 'systemQty', header: 'System Qty' },
    { key: 'delta', header: 'Variance' },
    { key: 'department', header: 'Department' },
    { key: 'countedAt', header: 'Counted At' },
    { key: 'countedBy', header: 'Counted By' },
    { key: 'notes', header: 'Notes' },
  ];

  return {
    columns,
    rows,
    fileName: 'clarification_reconciliation',
  };
}

export async function generateReport(
  reportType: ReportType,
  filters: ReportFilters,
  options: GenerateOptions = {}
): Promise<ReportResult> {
  switch (reportType) {
    case 'inventorySnapshot':
      return buildInventorySnapshot(filters, options);
    case 'departmentInventory':
      return buildDepartmentInventory(filters, options);
    case 'monthlyTally':
      return buildMonthlyTally(filters, options);
    case 'assignmentHistory':
      return buildAssignmentHistory(filters, options);
    case 'clarification':
      return buildClarification(filters, options);
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}

export async function getReportContext() {
  const [items, users] = await Promise.all([
    Item.find({ isScrap: { $ne: true } }, 'name category itemId assignmentHistory.user').sort({ name: 1 }).lean(),
    User.find({}, 'name department').sort({ name: 1 }).lean(),
  ]);

  const userDepartmentMap = new Map<string, string>();
  users.forEach((user: any) => {
    if (user && user._id) {
      const dept = (user.department || '').trim();
      if (dept) {
        userDepartmentMap.set(user._id.toString(), dept);
      }
    }
  });

  const departmentItemsMap = new Map<string, Set<string>>();
  items.forEach((item: any) => {
    const itemId = item?._id?.toString();
    if (!itemId) return;
    (item.assignmentHistory || []).forEach((hist: any) => {
      const userId = hist?.user?.toString?.();
      if (!userId) return;
      const department = userDepartmentMap.get(userId);
      if (!department) return;
      const normalized = department.trim();
      if (!normalized) return;
      const entry = departmentItemsMap.get(normalized) || new Set<string>();
      entry.add(itemId);
      departmentItemsMap.set(normalized, entry);
    });
  });

  const departments = Array.from(
    new Set(
      users
        .map((u: any) => (u.department || '').trim())
        .filter(Boolean)
    )
  ).sort();

  return {
    items: items.map((item: any) => ({
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      itemId: item.itemId || '',
    })),
    users: users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name,
      department: user.department || '',
    })),
    departments,
    departmentItems: Object.fromEntries(
      Array.from(departmentItemsMap.entries()).map(([dept, set]) => [dept, Array.from(set)])
    ),
    categories: Array.from(new Set(items.map((i: any) => i.category).filter(Boolean))).sort(),
  };
}
