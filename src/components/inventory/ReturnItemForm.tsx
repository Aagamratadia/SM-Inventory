"use client";

import React, { useState } from "react";
import { IItem } from "@/models/Item";

interface ReturnItemFormProps {
  item: IItem;
  onItemReturned: (item: IItem) => void;
  onClose: () => void;
}

export default function ReturnItemForm({ item, onItemReturned, onClose }: ReturnItemFormProps) {
  const available = item.quantity || 0;
  const total = (item as any).totalQuantity ?? available;
  const assignedOut = Math.max(total - available, 0);

  const [quantity, setQuantity] = useState<number>(assignedOut > 0 ? 1 : 0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignedOut <= 0) {
      setError("No assigned stock to return.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > assignedOut) {
      setError(`Enter a quantity between 1 and ${assignedOut}.`);
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/items/${item._id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to return item");
      }
      const updated = await res.json();
      onItemReturned(updated);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="text-sm text-gray-700">
        <p>
          <strong>{item.name}</strong>
        </p>
        <p>Available: {available} / Total: {total}</p>
        <p>Currently assigned out: {assignedOut}</p>
      </div>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          Quantity to return
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          disabled={assignedOut <= 0}
        >
          {Array.from({ length: assignedOut }, (_, idx) => idx + 1).map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || assignedOut <= 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {submitting ? "Returning..." : "Return"}
        </button>
      </div>
    </form>
  );
}
