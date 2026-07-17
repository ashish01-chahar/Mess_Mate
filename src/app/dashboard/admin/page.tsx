"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";

const Charts = dynamic(() => import("@/components/AdminCharts"), { ssr: false });

const adminNav = [
  { label: "Dashboard", href: "/dashboard/admin", icon: "📊" },
  { label: "Users", href: "/dashboard/admin/users", icon: "👥" },
  { label: "Menu", href: "/dashboard/admin/menu", icon: "🍽️" },
  { label: "Notifications", href: "/dashboard/admin/notifications", icon: "🔔" },
  { label: "Reports", href: "/dashboard/admin/reports", icon: "📈" },
  { label: "Holidays", href: "/dashboard/admin/holidays", icon: "📅" },
];

interface Report {
  totalStudents: number;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  totalMeals: number;
  foodSaved: number;
  foodSavedPercent: number;
  avgRating: number;
}

interface MenuItem {
  id: number;
  mealType: string;
  foodItems: string[];
}

interface Notification {
  id: number;
  title: string;
  message: string;
}

export default function AdminDashboard() {
  const [report, setReport] = useState<Report | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [weeklyData, setWeeklyData] = useState<Array<{ date: string; breakfast: number; lunch: number; dinner: number; saved: number }>>([]);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    // Fetch today's report
    fetch(`/api/admin/reports?date=${today}`)
      .then(r => r.json())
      .then(d => { if (d.report) setReport(d.report); })
      .catch(() => {});

    // Fetch today's menu
    fetch(`/api/admin/menu?date=${today}`)
      .then(r => r.json())
      .then(d => setMenuItems(d.menu || []))
      .catch(() => {});

    // Fetch notifications
    fetch("/api/admin/notifications")
      .then(r => r.json())
      .then(d => setNotifications((d.notifications || []).slice(0, 5)))
      .catch(() => {});

    // Fetch weekly data
    const from = new Date();
    from.setDate(from.getDate() - 7);
    fetch(`/api/admin/reports?from=${from.toISOString().slice(0, 10)}&to=${today}`)
      .then(r => r.json())
      .then(d => setWeeklyData(d.reports || []))
      .catch(() => {});
  }, [today]);

  return (
    <DashboardLayout role="admin" navItems={adminNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Admin Dashboard</h2>
        <p className="text-slate-500 text-sm">Overview of today&apos;s mess operations • {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="👥" label="Total Students" value={report?.totalStudents ?? "—"} color="bg-blue-50 text-blue-600" />
        <StatCard icon="🌅" label="Breakfast" value={report?.breakfastCount ?? "—"} color="bg-amber-50 text-amber-600" />
        <StatCard icon="☀️" label="Lunch" value={report?.lunchCount ?? "—"} color="bg-green-50 text-green-600" />
        <StatCard icon="🌙" label="Dinner" value={report?.dinnerCount ?? "—"} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🍽️" label="Total Meals" value={report?.totalMeals ?? "—"} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon="🌱" label="Food Saved" value={report ? `${report.foodSaved} plates` : "—"} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon="📉" label="Waste Reduction" value={report ? `${report.foodSavedPercent}%` : "—"} color="bg-teal-50 text-teal-600" />
        <StatCard icon="⭐" label="Avg Rating" value={report?.avgRating ? `${report.avgRating}/5` : "—"} color="bg-yellow-50 text-yellow-600" />
      </div>

      {/* Charts & Menu */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">📊 Weekly Meal Trends</h3>
          <Charts data={weeklyData} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">🍽️ Today&apos;s Menu</h3>
          {menuItems.length === 0 ? (
            <p className="text-slate-400 text-sm">No menu published for today</p>
          ) : (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50">
                  <div className="font-medium text-sm capitalize text-indigo-600 mb-1">
                    {item.mealType === "breakfast" ? "🌅" : item.mealType === "lunch" ? "☀️" : "🌙"} {item.mealType}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(item.foodItems as string[]).map((food, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-slate-600 border">{food}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Food Waste Impact + Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-4">🌱 Food Waste Reduction Impact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/15 rounded-xl p-4">
              <div className="text-3xl font-bold">{report?.foodSaved ?? 0}</div>
              <div className="text-sm opacity-80">Plates Saved Today</div>
            </div>
            <div className="bg-white/15 rounded-xl p-4">
              <div className="text-3xl font-bold">{report?.foodSavedPercent ?? 0}%</div>
              <div className="text-sm opacity-80">Waste Reduced</div>
            </div>
            <div className="bg-white/15 rounded-xl p-4">
              <div className="text-3xl font-bold">₹{(report?.foodSaved ?? 0) * 35}</div>
              <div className="text-sm opacity-80">Cost Saved</div>
            </div>
            <div className="bg-white/15 rounded-xl p-4">
              <div className="text-3xl font-bold">{Math.round((report?.foodSaved ?? 0) * 0.5)}L</div>
              <div className="text-sm opacity-80">Water Saved</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">🔔 Recent Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-slate-400 text-sm">No notifications yet</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-medium text-sm text-slate-800">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 card-hover">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
