"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const studentNav = [
  { label: "Dashboard", href: "/dashboard/student", icon: "🏠" },
  { label: "Meal History", href: "/dashboard/student/history", icon: "📋" },
  { label: "Notifications", href: "/dashboard/student/notifications", icon: "🔔" },
  { label: "QR Pass", href: "/dashboard/student/qr", icon: "📱" },
  { label: "Feedback", href: "/dashboard/student/feedback", icon: "⭐" },
  { label: "Profile", href: "/dashboard/student/profile", icon: "👤" },
];

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

export default function StudentNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then(r => r.json())
      .then(d => setItems(d.notifications || []));
  }, []);

  return (
    <DashboardLayout role="student" navItems={studentNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-sm text-slate-500">Important announcements from the mess admin</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {items.map(n => (
          <div key={n.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 slide-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🔔</div>
              <div>
                <div className="font-semibold text-slate-800">{n.title}</div>
                <div className="text-sm text-slate-600 mt-1">{n.message}</div>
                <div className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border">
            <div className="text-4xl mb-3">🔕</div>
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
