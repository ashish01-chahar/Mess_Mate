"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";

const Charts = dynamic(() => import("@/components/AdminCharts"), { ssr: false });
const FoodWasteChart = dynamic(() => import("@/components/FoodWasteChart"), { ssr: false });

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

interface ItemRequest {
  name: string;
  count: number;
}

interface WasteAnalytic {
  name: string;
  selected: number;
  served: number;
  waste: number;
}

export default function AdminDashboard() {
  const [report, setReport] = useState<Report | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [weeklyData, setWeeklyData] = useState<Array<{ date: string; breakfast: number; lunch: number; dinner: number; saved: number }>>([]);
  
  // New checklist analytics states
  const [itemRequests, setItemRequests] = useState<ItemRequest[]>([]);
  const [wasteAnalytics, setWasteAnalytics] = useState<WasteAnalytic[]>([]);

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

    // Fetch checklist requests and food waste analytics
    fetch(`/api/admin/analytics?date=${today}`)
      .then(r => r.json())
      .then(d => {
        setItemRequests(d.itemRequests || []);
        setWasteAnalytics(d.foodWasteAnalytics || []);
      })
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
        <StatCard icon="👥" label="Total Students" value={report?.totalStudents ?? "—"} color="bg-blue-50 text-blue-600 border border-blue-100" />
        <StatCard icon="🌅" label="Breakfast Selections" value={report?.breakfastCount ?? "—"} color="bg-amber-50 text-amber-600 border border-amber-100" />
        <StatCard icon="☀️" label="Lunch Selections" value={report?.lunchCount ?? "—"} color="bg-green-50 text-green-600 border border-green-100" />
        <StatCard icon="🌙" label="Dinner Selections" value={report?.dinnerCount ?? "—"} color="bg-purple-50 text-purple-600 border border-purple-100" />
      </div>

      {/* Checklist analytics: Today's top item requests */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
          <span>🍽️</span> Today&apos;s Food Item Selections (Checklist Requests)
        </h3>
        {itemRequests.length === 0 ? (
          <p className="text-sm text-slate-400">No checklists selected for today yet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {itemRequests.slice(0, 12).map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
                <span className="text-xs font-semibold text-slate-500 truncate">{item.name}</span>
                <span className="text-xl font-black text-indigo-600 mt-1">{item.count} <span className="text-[10px] font-normal text-slate-400">reqs</span></span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food Waste Analytics Chart & Details */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
            <span>🌱</span> Food Waste Estimations (Prepared vs Served vs Waste)
          </h3>
          <FoodWasteChart data={wasteAnalytics} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 text-sm mb-4">📈 Waste Impact Stats</h3>
          {wasteAnalytics.length === 0 ? (
            <p className="text-slate-400 text-sm py-12 text-center">No waste analytics available</p>
          ) : (
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
              {wasteAnalytics.map((item, idx) => {
                const wastePercent = item.selected > 0 ? Math.round((item.waste / item.selected) * 100) : 0;
                return (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-700">{item.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        wastePercent > 20
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {wastePercent}% Waste
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500">
                      <div>Prep: <strong>{item.selected}</strong></div>
                      <div>Served: <strong>{item.served}</strong></div>
                      <div className="text-red-500">Waste: <strong>{item.waste}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Trends & Today's Menu */}
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
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-xs capitalize text-indigo-600 mb-1.5">
                    {item.mealType === "breakfast" ? "🌅" : item.mealType === "lunch" ? "☀️" : "🌙"} {item.mealType}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.foodItems.map((food, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white rounded text-[10px] font-medium text-slate-600 border border-slate-200">{food}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Notifications */}
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
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 card-hover">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg mb-3`}>{icon}</div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-semibold">{label}</div>
    </div>
  );
}
