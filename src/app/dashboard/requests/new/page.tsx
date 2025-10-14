'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Item {
  _id: string;
  name: string;
  category?: string;
  quantity?: number; // on-hand
  reserved?: number;
}

interface Shortage {
  itemId: string;
  available: number;
  requested: number;
}

interface UserDoc {
  _id: string;
  name?: string;
  role?: 'admin' | 'staff' | 'user';
  department?: string;
}

type Line = { id: string; category?: string; itemId?: string; qty?: number };

export default function NewRequestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [me, setMe] = useState<UserDoc | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shortages, setShortages] = useState<Shortage[] | null>(null);
  const [lines, setLines] = useState<Line[]>([{ id: crypto.randomUUID() }]);

  // Load user profile (for name/department) and items
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [itemsRes, userRes] = await Promise.all([
          fetch('/api/items'),
          session?.user?.id ? fetch(`/api/users/${session.user.id}`) : Promise.resolve({ ok: false } as any),
        ]);
        if (!itemsRes.ok) throw new Error('Failed to load items');
        const itemsData: Item[] = await itemsRes.json();
        setItems(itemsData);
        if ((userRes as any).ok) {
          const userData: UserDoc = await (userRes as any).json();
          setMe(userData);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [session?.user?.id]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return Array.from(set).sort();
  }, [items]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, Item[]>();
    items.forEach((i: Item) => {
      const key = i.category || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    });
    Array.from(map.entries()).forEach(([_, arr]) => {
      arr.sort((a: Item, b: Item) => a.name.localeCompare(b.name));
    });
    return map;
  }, [items]);

  const availabilityMap = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach(i => m.set(i._id, (i.quantity || 0) - (i.reserved || 0)));
    return m;
  }, [items]);

  const addLine = () => setLines(prev => [...prev, { id: crypto.randomUUID() }]);
  const removeLine = (id: string) => setLines(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev);
  const setLine = (id: string, patch: Partial<Line>) => setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch, ...(patch.category ? { itemId: undefined } : {}) } : l));

  const selectedLines = useMemo(() => lines
    .filter(l => l.itemId && (l.qty || 0) > 0)
    .map(l => ({ itemId: l.itemId as string, qty: Number(l.qty) })), [lines]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setShortages(null);
    setError(null);
    try {
      if (selectedLines.length === 0) {
        setError('Please add at least one item and quantity.');
        setSubmitting(false);
        return;
      }
      // Prevent duplicate items within the same request
      const ids = selectedLines.map(l => l.itemId);
      const dup = ids.find((id, idx) => ids.indexOf(id) !== idx);
      if (dup) {
        setError('Duplicate items are not allowed in a single request. Remove duplicates.');
        setSubmitting(false);
        return;
      }
      // Client-side availability hinting (non-authoritative)
      const localShortages: Shortage[] = [];
      for (const l of selectedLines) {
        const avail = availabilityMap.get(l.itemId) ?? 0;
        if (l.qty > avail) localShortages.push({ itemId: l.itemId, available: avail, requested: l.qty });
      }
      if (localShortages.length) {
        setShortages(localShortages);
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedLines, note: note || undefined }),
      });
      if (res.status === 201) {
        router.push('/dashboard/requests');
        return;
      }
      if (res.status === 409) {
        const data = await res.json();
        setShortages(Array.isArray(data?.shortages) ? data.shortages : []);
        setSubmitting(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || `Request failed (${res.status})`);
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="px-8 pt-4 pb-8 min-h-screen text-sm" style={{ background: 'linear-gradient(180deg, #EEF2FF 0%, #FFFFFF 120px)' }}>
      {/* Header */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA)', color: 'white' }}>
        <h1 className="text-2xl font-bold">Item Request Form</h1>
        <p className="text-sm opacity-90">Submit your request. Availability is subjective.</p>
      </div>

      {/* User info (autofilled) */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border" style={{ borderColor: '#E5E7EB' }}>
        <div className="mb-2 font-semibold" style={{ color: '#111827' }}>Requester</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Name</label>
            <input disabled value={me?.name || ''} className="w-full p-2 border rounded bg-gray-50" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Department</label>
            <input disabled value={me?.department || ''} className="w-full p-2 border rounded bg-gray-50" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Role</label>
            <input disabled value={(session?.user as any)?.role || ''} className="w-full p-2 border rounded bg-gray-50" style={{ borderColor: '#E5E7EB' }} />
          </div>
        </div>
      </div>

      {/* Dynamic item lines: category -> item -> qty */}
      <div className="mb-4 space-y-3">
        {lines.map((l, idx) => {
          const catItems = l.category ? (itemsByCategory.get(l.category) || []) : [];
          const selectedItem = catItems.find(ci => ci._id === l.itemId);
          const available = selectedItem ? ((selectedItem.quantity || 0) - (selectedItem.reserved || 0)) : undefined;
          const selectedIds = new Set(lines.filter(x => x.itemId && x.id !== l.id).map(x => x.itemId as string));
          return (
            <div key={l.id} className="bg-white rounded-lg shadow-sm p-4 border" style={{ borderColor: '#E5E7EB' }}>
              <div className="mb-2 font-semibold" style={{ color: '#111827' }}>Item {idx + 1}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Category</label>
                  <select value={l.category || ''} onChange={(e) => setLine(l.id, { category: e.target.value || undefined })} className="w-full p-2 border rounded bg-white" style={{ borderColor: '#E5E7EB' }}>
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Item</label>
                  <select value={l.itemId || ''} onChange={(e) => setLine(l.id, { itemId: e.target.value || undefined })} className="w-full p-2 border rounded bg-white" style={{ borderColor: '#E5E7EB' }} disabled={!l.category}>
                    <option value="">{l.category ? 'Select an item' : 'Select category first'}</option>
                    {catItems.map(ci => {
                      const disabled = selectedIds.has(ci._id);
                      return (
                        <option key={ci._id} value={ci._id} disabled={disabled}>{ci.name}{disabled ? ' (already selected)' : ''}</option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                  <input type="number" min={1} step={1} value={l.qty ?? ''} onChange={(e) => setLine(l.id, { qty: Math.max(1, Math.floor(Number(e.target.value || 0))) })} className="w-full p-2 border rounded" style={{ borderColor: '#E5E7EB' }} disabled={!l.itemId || submitting} placeholder="1" />
                  {available !== undefined && l.qty && l.qty > available && (
                    <div className="mt-1 text-xs" style={{ color: '#B45309' }}>Only {available} available.</div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex justify-between">
                <div className="text-xs text-gray-500">
                  {available !== undefined ? `Available now: ${available}` : ''}
                </div>
                <button type="button" onClick={() => removeLine(l.id)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }} disabled={lines.length === 1 || submitting}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6">
        <button type="button" onClick={addLine} className="px-3 py-1.5 text-sm rounded-md text-white" style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }} disabled={submitting}>Add another item</button>
      </div>

      {/* Notes moved to the end */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border" style={{ borderColor: '#E5E7EB' }}>
        <label className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>Purpose / Notes (optional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-3 border rounded" style={{ borderColor: '#E5E7EB' }} rows={3} placeholder="Describe the purpose or context" />
      </div>

      {shortages && shortages.length > 0 && (
        <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
          <div className="font-semibold mb-1">Some items do not have sufficient stock:</div>
          <ul className="list-disc ml-5 text-sm">
            {shortages.map((s) => {
              const it = items.find(i => i._id === s.itemId);
              return (
                <li key={s.itemId}>{it?.name || s.itemId}: requested {s.requested}, available {s.available}</li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button disabled={submitting || !!shortages?.length} onClick={handleSubmit} className="px-4 py-2 text-white rounded-md" style={{ background: submitting || !!shortages?.length ? '#9CA3AF' : 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}
