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

interface ReportResult {
  columns: { key: string; header: string }[];
  rows: Record<string, any>[];
  fileName: string;
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

  const [result, setResult] = useState<ReportResult | null>(null);
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

  const [itemSearch, setItemSearch] = useState('');
  const [selectAllItems, setSelectAllItems] = useState(false);
  const [selectAllDepartments, setSelectAllDepartments] = useState(true);
  const [selectAllUsers, setSelectAllUsers] = useState(true);

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
    setItemSearch('');
    setSelectAllItems(false);
    setSelectAllDepartments(true);
    setSelectAllUsers(true);
  }, []);

  const handleReportChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ReportType;
    setReportType(value);
    setResult(null);
    setError('');
    resetFiltersForReport(value);
  };

  const handleFilterChange = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applicableUsers = useMemo(() => context?.users || [], [context]);

  const filteredItems = useMemo(() => {
    if (!context) return [] as ReportContext['items'];

    let scopedItems = context.items;
    if (filters.department && context.departmentItems) {
      const deptIds = new Set(context.departmentItems[filters.department] || []);
      scopedItems = scopedItems.filter((item) => deptIds.has(item.id));
    }

    const term = itemSearch.trim().toLowerCase();
    if (!term) return scopedItems;

    return scopedItems.filter((item) => {
      const haystack = `${item.name} ${item.itemId || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [context, filters.department, itemSearch]);

  const toggleItemId = (itemId: string) => {
    setFilters((prev) => {
      const current = new Set(prev.itemIds || []);
      current.has(itemId) ? current.delete(itemId) : current.add(itemId);
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

    setFilters((prev) => {
      let nextItemIds = prev.itemIds;
      if (context?.departmentItems) {
        if (nextDepartment) {
          const deptItems = context.departmentItems[nextDepartment] || [];
          nextItemIds = deptItems.length ? deptItems : undefined;
        } else {
          nextItemIds = prev.itemIds;
        }
      }
      return {
        ...prev,
        department: nextDepartment,
        itemIds: nextItemIds,
      };
    });

    setSelectAllItems(false);
  };

  const toggleSelectAllDepartments = () => {
    const shouldSelectAll = !selectAllDepartments;
    setSelectAllDepartments(shouldSelectAll);
    if (shouldSelectAll) {
      handleFilterChange('department', undefined);
    }
  };

  const toggleSelectAllUsers = () => {
    const shouldSelectAll = !selectAllUsers;
    setSelectAllUsers(shouldSelectAll);
    if (shouldSelectAll) {
      handleFilterChange('userId', undefined);
      handleFilterChange('performedBy', undefined);
    }
  };

  useEffect(() => {
    const available = filteredItems.length;
    if (available === 0) {
      setSelectAllItems(false);
      return;
    }
    const selectedCount = (filters.itemIds || []).filter((id) => filteredItems.some((item) => item.id === id)).length;
    setSelectAllItems(selectedCount === available);
  }, [filteredItems, filters.itemIds]);

  useEffect(() => {
    setSelectAllDepartments(!filters.department);
  }, [filters.department]);

  useEffect(() => {
    setSelectAllUsers(!filters.userId);
  }, [filters.userId]);

  const handlePreview = async () => {
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
        body: JSON.stringify({ reportType, filters, fullExport: false }),
      });
      if (!res.ok) {
        let data: any = {};
        try {
          data = await res.json();
        } catch (e) {
          // ignore
        }
        throw new Error(data.message || 'Failed to generate report preview');
      }
      const json = (await res.json()) as ReportResult;
      setResult(json);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report preview');
    } finally {
      setLoading(false);
    }
  };

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
        } catch (e) {
          // ignore
        }
        throw new Error(data.message || 'Failed to export report');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(result?.fileName || reportType).replace(/[^a-z0-9-_]/gi, '_')}.xlsx`;
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
      await handlePreview();
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
    setResult(null);
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
              Generate inventory and assignment reports, preview them, and export to Excel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePreview}
              disabled={loading || contextLoading}
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading ? 'Loading...' : 'Preview'}
            </button>
            <button
              onClick={handleExport}
              disabled={loading || contextLoading}
              className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 disabled:opacity-60"
            >
              Export XLSX
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              placeholder="Item name, vendor, ID..."
              className="w-full border border-gray-300 rounded-md p-2"
            />
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search items"
                  className="border border-gray-300 rounded-md p-2 text-sm"
                />
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
                <p className="text-sm text-gray-500">No items match your search.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Category</label>
              </div>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
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

      <section className="bg-white shadow rounded-lg">
        <header className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Preview</h2>
          <span className="text-sm text-gray-500">Showing first 500 rows</span>
        </header>
        <div className="overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : result && result.columns.length ? (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {result.columns.map((column) => (
                    <th key={column.key} className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {result.columns.map((column) => (
                      <td key={column.key} className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {String(row[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-sm text-gray-500">No data to display. Adjust filters and click Preview.</div>
          )}
        </div>
      </section>
    </div>
  );
}
