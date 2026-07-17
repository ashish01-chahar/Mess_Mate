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

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/notifications");
    const data = await res.json();
    setItems(data.notifications || []);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message }),
    });
    if (res.ok) {
      setMsg("Notification sent!");
      setTitle("");
      setMessage("");
      load();
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
    load();
  }

  const templates = [
    { t: "Menu Update", m: "Today's lunch menu has been updated. Check the new items!" },
    { t: "Meal Reminder", m: "Don't forget to select today's dinner before 5 PM." },
    { t: "Holiday Notice", m: "Mess will remain closed tomorrow. Plan accordingly." },
    { t: "Sunday Special", m: "Sunday Special: Paneer Butter Masala, Biryani & Kheer!" },
  ];

  return (
    <DashboardLayout role="admin" navItems={adminNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-sm text-slate-500">Send notifications to all students</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="font-semibold mb-4">📝 Send Notification</h3>
            {msg && <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm mb-4">{msg}</div>}
            <form onSubmit={handleSend} className="space-y-4">
              <input
                placeholder="Notification Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                required
              />
              <textarea
                placeholder="Notification Message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none resize-none"
                required
              />
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Send to All Students
              </button>
            </form>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold mb-3">⚡ Quick Templates</h3>
            <div className="space-y-2">
              {templates.map((tmpl, i) => (
                <button
                  key={i}
                  onClick={() => { setTitle(tmpl.t); setMessage(tmpl.m); }}
                  className="w-full text-left p-3 rounded-xl hover:bg-indigo-50 transition-colors border border-slate-100"
                >
                  <div className="font-medium text-sm text-slate-800">{tmpl.t}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{tmpl.m}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sent Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">📨 Sent Notifications ({items.length})</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {items.map(n => (
              <div key={n.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm text-slate-800">{n.title}</div>
                  <button onClick={() => handleDelete(n.id)} className="text-xs text-red-500 hover:underline ml-2">×</button>
                </div>
                <div className="text-sm text-slate-600 mt-1">{n.message}</div>
                <div className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {items.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No notifications sent yet</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
