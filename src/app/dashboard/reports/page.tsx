'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ReportContext {
  items: { id: string; name: string; category: string; itemId: string }[];
  users: { id: string; name: string; department: string }[];
  departments: string[];
  departmentItems?: Record<string, string[]>;
  categories: string[];
}

type ReportType =
  | 'inventorySnapshot'
  | 'departmentInventory'
  | 'monthlyTally'
  | 'assignmentHistory'
  | 'clarification';

interface ReportFilters {
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

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'inventorySnapshot', label: 'Inventory Snapshot' },
  { value: 'departmentInventory', label: 'Department Inventory' },
  { value: 'monthlyTally', label: 'Monthly Stock Tally' },
  { value: 'assignmentHistory', label: 'Assignment History' },
  { value: 'clarification', label: 'Clarification (Physical vs System)' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'returned', label: 'Returned' },
];

const INITIAL_FILTERS: ReportFilters = {
  includeStockAdditions: false,
};

const arraysEqual = (a?: string[], b?: string[]) => {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

function getReportHelpText(reportType: ReportType): string {
  switch (reportType) {
    case 'inventorySnapshot':
      return 'Shows current stock balances. Optionally include historical stock additions.';
    case 'departmentInventory':
      return 'Aggregates item assignments by department based on assignment history.';
    case 'monthlyTally':
      return 'Combines stock additions and assignment actions within the selected date range.';
    case 'assignmentHistory':
      return 'Detailed assignment and return history with actors and departments.';
    case 'clarification':
      return 'Compare physical counts against system quantities and log reconciliations for audit.';
    default:
      return '';
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [context, setContext] = useState<ReportContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState('');

  const [reportType, setReportType] = useState<ReportType>('inventorySnapshot');
  const [filters, setFilters] = useState<ReportFilters>({ ...INITIAL_FILTERS });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [reconSubmitting, setReconSubmitting] = useState(false);
  const [reconForm, setReconForm] = useState({
    itemId: '',
    countedQty: '',
    department: '',
    countedAt: '',
    notes: '',
  });

  const [selectAllItems, setSelectAllItems] = useState(false);
  const [selectAllDepartments, setSelectAllDepartments] = useState(true);
  const [selectAllUsers, setSelectAllUsers] = useState(true);
  const [itemScope, setItemScope] = useState<'department' | 'category'>('department');

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!isAdmin) return;

    const fetchContext = async () => {
      setContextLoading(true);
      setContextError('');
      try {
        const res = await fetch('/api/reports?mode=context', {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load report context');
        }
        const data = (await res.json()) as ReportContext;
        setContext(data);
      } catch (err: any) {
        setContextError(err.message || 'Failed to load report context');
      } finally {
        setContextLoading(false);
      }
    };

    fetchContext();
  }, [status, isAdmin]);

  const resetFiltersForReport = useCallback((type: ReportType) => {
    setFilters({
      ...INITIAL_FILTERS,
      includeStockAdditions: type === 'inventorySnapshot' ? false : undefined,
    });
    setSelectAllItems(false);
    setSelectAllDepartments(true);
    setSelectAllUsers(true);
    setItemScope('department');
  }, []);

  const handleReportChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ReportType;
    setReportType(value);
    setError('');
    resetFiltersForReport(value);
  };

  const handleFilterChange = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleItemScopeChange = (scope: 'department' | 'category') => {
    setItemScope(scope);
    setSelectAllItems(false);
  };

  const applicableUsers = useMemo(() => context?.users || [], [context]);

  const filteredItems = useMemo(() => {
    if (!context) return [] as ReportContext['items'];

    let scopedItems = context.items;
    if (itemScope === 'department' && filters.department && context.departmentItems) {
      const deptIds = new Set(context.departmentItems[filters.department] || []);
      scopedItems = scopedItems.filter((item) => deptIds.has(item.id));
    }

    if (itemScope === 'category' && filters.category) {
      scopedItems = scopedItems.filter((item) => item.category === filters.category);
    }

    return scopedItems;
  }, [context, filters.category, filters.department, filters.itemIds, itemScope]);

  const toggleItemId = (itemId: string) => {
    setFilters((prev) => {
      const current = new Set(prev.itemIds || []);
      if (current.has(itemId)) {
        current.delete(itemId);
      } else {
        current.add(itemId);
      }
      const values = Array.from(current);
      return {
        ...prev,
        itemIds: values.length ? values : undefined,
      };
    });
  };

  const toggleSelectAllItems = () => {
    if (!filteredItems.length) {
      setFilters((prev) => ({
        ...prev,
        itemIds: undefined,
      }));
      setSelectAllItems(false);
      return;
    }

    const shouldSelectAll = !selectAllItems;
    setSelectAllItems(shouldSelectAll);
    setFilters((prev) => ({
      ...prev,
      itemIds: shouldSelectAll ? filteredItems.map((item) => item.id) : undefined,
    }));
  };

  const handleDepartmentChange = (value: string) => {
    const nextDepartment = value || undefined;
    const deptItems = nextDepartment && context?.departmentItems ? context.departmentItems[nextDepartment] || [] : [];

    setFilters((prev) => {
      let nextItemIds = prev.itemIds;
      if (itemScope === 'department') {
        nextItemIds = nextDepartment ? (deptItems.length ? [...deptItems] : undefined) : undefined;
      }
      return {
        ...prev,
        department: nextDepartment,
        itemIds: nextItemIds,
      };
    });

    if (itemScope === 'department') {
      setSelectAllItems(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    const nextCategory = value || undefined;
    const categoryItems = nextCategory && context
      ? context.items.filter((item) => item.category === nextCategory).map((item) => item.id)
      : [];

    setFilters((prev) => {
      let nextItemIds = prev.itemIds;
      if (itemScope === 'category') {
        nextItemIds = nextCategory ? (categoryItems.length ? categoryItems : undefined) : undefined;
      }
      return {
        ...prev,
        category: nextCategory,
        itemIds: nextItemIds,
      };
    });

    if (itemScope === 'category') {
      setSelectAllItems(false);
    }
  };

  const toggleSelectAllDepartments = () => {
    const next = !selectAllDepartments;
    setSelectAllDepartments(next);
    if (next) {
      handleDepartmentChange('');
    }
  };

  const toggleSelectAllUsers = () => {
    setSelectAllUsers((prev) => {
      const next = !prev;
      if (next) {
        handleFilterChange('userId', undefined);
        handleFilterChange('performedBy', undefined);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!context) return;

    let nextItemIds: string[] | undefined;
    if (itemScope === 'department') {
      if (filters.department && context.departmentItems) {
        const deptIds = context.departmentItems[filters.department] || [];
        nextItemIds = deptIds.length ? [...deptIds] : undefined;
      } else {
        nextItemIds = undefined;
      }
    } else if (itemScope === 'category') {
      if (filters.category) {
        const categoryIds = context.items
          .filter((item) => item.category === filters.category)
          .map((item) => item.id);
        nextItemIds = categoryIds.length ? categoryIds : undefined;
      } else {
        nextItemIds = undefined;
      }
    }

    if (arraysEqual(filters.itemIds, nextItemIds)) {
      return;
    }

    setFilters((prev) => ({
      ...prev,
      itemIds: nextItemIds,
    }));
  }, [context, filters.category, filters.department, itemScope]);

  useEffect(() => {
    if (!filteredItems.length) {
      if (selectAllItems) {
        setSelectAllItems(false);
      }
      return;
    }
    const selectedCount = (filters.itemIds || []).filter((id) =>
      filteredItems.some((item) => item.id === id)
    ).length;
    const isAllSelected = selectedCount === filteredItems.length;
    if (selectAllItems !== isAllSelected) {
      setSelectAllItems(isAllSelected);
    }
  }, [filteredItems, filters.itemIds, selectAllItems]);

  useEffect(() => {
    setSelectAllDepartments(!filters.department);
  }, [filters.department]);

  useEffect(() => {
    setSelectAllUsers(!filters.userId);
  }, [filters.userId]);

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reportType, filters, fullExport: true }),
      });
      if (!res.ok) {
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          // ignore
        }
        throw new Error(data.message || 'Failed to export report');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType.replace(/[^a-z0-9-_]/gi, '_')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Export started. Check your downloads for the Excel file.');
    } catch (err: any) {
      setError(err.message || 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const handleReconSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reconForm.countedQty === '') {
      setError('Counted quantity is required.');
      return;
    }
    setReconSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/reconciliations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId: reconForm.itemId || undefined,
          countedQty: Number(reconForm.countedQty),
          department: reconForm.department || undefined,
          countedAt: reconForm.countedAt || undefined,
          notes: reconForm.notes || undefined,
        }),
      });
      if (!res.ok) {
        let data: any = {};
        try {
          data = await res.json();
        } catch (e) {
          // ignore
        }
        throw new Error(data.message || 'Failed to record reconciliation');
      }
      setReconForm({ itemId: '', countedQty: '', department: '', countedAt: '', notes: '' });
      setSuccessMessage('Reconciliation recorded successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to record reconciliation');
    } finally {
      setReconSubmitting(false);
    }
  };

  useEffect(() => {
    if (reportType === 'inventorySnapshot') {
      setFilters((prev) => ({ ...prev, includeStockAdditions: prev.includeStockAdditions ?? false }));
    } else {
      setFilters((prev) => ({
        ...prev,
        includeStockAdditions: undefined,
        action: reportType === 'assignmentHistory' ? prev.action : undefined,
      }));
    }
  }, [reportType]);

  if (status === 'loading') {
    return <div className="p-8">Loading session...</div>;
  }
  if (!isAdmin) {
    return <div className="p-8 text-red-600">Access restricted to administrators.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <section className="space-y-4">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Reports &amp; Exports</h1>
            <p className="text-sm text-gray-600 mt-1">
              Generate inventory and assignment reports and export them to Excel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              disabled={loading || contextLoading}
              className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 disabled:opacity-60"
            >
              {loading ? 'Preparing…' : 'Export XLSX'}
            </button>
          </div>
        </header>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Report Type</label>
            <select
              value={reportType}
              onChange={handleReportChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              {REPORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">{getReportHelpText(reportType)}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <button
                type="button"
                onClick={toggleSelectAllDepartments}
                className="text-xs text-indigo-600 hover:underline"
              >
                {selectAllDepartments ? 'Filter department' : 'Show all departments'}
              </button>
            </div>
            <select
              value={filters.department || ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">All Departments</option>
              {(context?.departments || []).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Selecting a department auto-filters items assigned to that department. Toggle above to clear.
            </p>
          </div>

          <section className="space-y-3">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-gray-700">Item Selection</h2>
                <p className="text-xs text-gray-500">
                  Choose whether to scope items by department assignments or by category, then pick specific items.
                </p>
              </div>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => handleItemScopeChange('department')}
                  className={`px-3 py-1 text-sm font-medium border ${
                    itemScope === 'department'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  } rounded-l-md`}
                >
                  Department scope
                </button>
                <button
                  type="button"
                  onClick={() => handleItemScopeChange('category')}
                  className={`px-3 py-1 text-sm font-medium border-t border-b ${
                    itemScope === 'category'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  } rounded-r-md`}
                >
                  Category scope
                </button>
              </div>
            </header>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Items</span>
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={selectAllItems}
                  onChange={toggleSelectAllItems}
                  className="h-4 w-4"
                />
                Select all
              </label>
            </div>

            <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto p-2 space-y-2">
              {filteredItems.map((item) => {
                const checked = filters.itemIds?.includes(item.id) ?? false;
                return (
                  <label key={item.id} className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItemId(item.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1">
                      {item.name}
                      {item.itemId ? <span className="text-xs text-gray-500"> ({item.itemId})</span> : null}
                    </span>
                    <span className="text-xs text-gray-400">{item.category}</span>
                  </label>
                );
              })}
              {filteredItems.length === 0 && (
                <p className="text-sm text-gray-500">No items available for the chosen scope.</p>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Category</label>
              </div>
              <select
                value={filters.category || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">All Categories</option>
                {(context?.categories || []).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">User / Assignee</label>
                <button
                  type="button"
                  onClick={toggleSelectAllUsers}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {selectAllUsers ? 'Filter user' : 'Show all users'}
                </button>
              </div>
              <select
                value={filters.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">All Users</option>
                {applicableUsers.map((user: { id: string; name: string }) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(reportType === 'assignmentHistory' || reportType === 'monthlyTally') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Performed By</label>
                <select
                  value={filters.performedBy || ''}
                  onChange={(e) => handleFilterChange('performedBy', e.target.value || undefined)}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">All Actors</option>
                  {applicableUsers.map((user: { id: string; name: string }) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', (e.target.value as 'assigned' | 'returned') || undefined)}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  {ACTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>

          {reportType === 'inventorySnapshot' && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters.includeStockAdditions ?? false}
                onChange={(e) => handleFilterChange('includeStockAdditions', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              Include stock additions detail
            </label>
          )}

          {contextLoading && <p className="text-sm text-gray-500">Loading reference data…</p>}
          {contextError && <p className="text-sm text-red-500">{contextError}</p>}
        </div>
      </section>

      {reportType === 'clarification' && (
        <section className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Log Physical Count</h2>
          <form onSubmit={handleReconSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select
                required
                value={reconForm.itemId}
                onChange={(e) => setReconForm((prev) => ({ ...prev, itemId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">Select an item</option>
                {(context?.items || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.itemId ? `(${item.itemId})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Counted Quantity</label>
              <input
                required
                type="number"
                min="0"
                value={reconForm.countedQty}
                onChange={(e) => setReconForm((prev) => ({ ...prev, countedQty: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={reconForm.department}
                onChange={(e) => setReconForm((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Counted At</label>
              <input
                type="datetime-local"
                value={reconForm.countedAt}
                onChange={(e) => setReconForm((prev) => ({ ...prev, countedAt: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={reconForm.notes}
                onChange={(e) => setReconForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional comments"
                className="w-full border border-gray-300 rounded-md p-2"
                rows={3}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={reconSubmitting}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                {reconSubmitting ? 'Saving...' : 'Record Reconciliation'}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      {successMessage && <div className="mb-4 text-sm text-green-600">{successMessage}</div>}
    </div>
  );
}
