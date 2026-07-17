"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const adminNav = [
  { label: "Dashboard", href: "/dashboard/admin", icon: "📊" },
  { label: "Users", href: "/dashboard/admin/users", icon: "👥" },
  { label: "Menu", href: "/dashboard/admin/menu", icon: "🍽️" },
  { label: "Notifications", href: "/dashboard/admin/notifications", icon: "🔔" },
  { label: "Reports", href: "/dashboard/admin/reports", icon: "📈" },
  { label: "Holidays", href: "/dashboard/admin/holidays", icon: "📅" },
];

interface Holiday {
  id: number;
  date: string;
  reason: string;
}

export default function HolidaysPage() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/holidays");
    const data = await res.json();
    setItems(data.holidays || []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason }),
    });
    if (res.ok) {
      setMsg("Holiday added!");
      setDate("");
      setReason("");
      load();
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/holidays?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <DashboardLayout role="admin" navItems={adminNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Holiday Management</h2>
        <p className="text-sm text-slate-500">Manage mess closure dates and holidays</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">📅 Add Holiday</h3>
          {msg && <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm mb-4">{msg}</div>}
          <form onSubmit={handleAdd} className="space-y-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <input placeholder="Reason (e.g., Republic Day)" value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Add Holiday
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">🏖️ Upcoming Holidays</h3>
          {items.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No holidays added</p>
          ) : (
            <div className="space-y-3">
              {items.map(h => (
                <div key={h.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="font-medium text-sm">{h.reason}</div>
                    <div className="text-xs text-slate-500">{new Date(h.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                  <button onClick={() => handleDelete(h.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
