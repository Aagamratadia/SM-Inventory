"use client";

import React, { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { User, Settings, LogOut } from "lucide-react";

export default function UserMenu({ name }: { name?: string | null }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
      >
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white" style={{ backgroundColor: "#6366F1" }}>
          <User className="w-4 h-4" />
        </span>
        <span className="text-sm font-medium" style={{ color: "#111827" }}>
          Welcome, {name || "User"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black/5 overflow-hidden z-50">
          <div className="py-2">
            <button className="w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-gray-50" style={{ color: "#4B5563" }}>
              <User className="w-4 h-4" />
              Profile
            </button>
            <button className="w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-gray-50" style={{ color: "#4B5563" }}>
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <div className="my-2 border-t" style={{ borderColor: "#E5E7EB" }} />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-red-50"
              style={{ color: "#DC2626" }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
