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

interface HistoryEntry {
  id: number;
  date: string;
  mealType: string;
  status: "Served" | "Missed" | "Not Taken";
  items: string[];
  servedAt: string | null;
  staffName: string | null;
}

export default function MealHistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Served" | "Missed" | "Not Taken">("all");
  const [mealFilter, setMealFilter] = useState<"all" | "breakfast" | "lunch" | "dinner">("all");

  useEffect(() => {
    fetch("/api/meals/history")
      .then((r) => r.json())
      .then((d) => {
        setHistory(d.history || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalMealsTracked = history.length;
  const servedCount = history.filter((h) => h.status === "Served").length;
  const missedCount = history.filter((h) => h.status === "Missed").length;
  const attendanceRate = totalMealsTracked > 0 ? Math.round((servedCount / (servedCount + missedCount || 1)) * 100) : 0;

  const filteredHistory = history.filter((h) => {
    // Status Filter
    if (statusFilter !== "all" && h.status !== statusFilter) return false;
    // Meal Filter
    if (mealFilter !== "all" && h.mealType !== mealFilter) return false;
    // Search Filter (date or food items)
    if (search) {
      const dateStr = new Date(h.date + "T00:00:00")
        .toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        .toLowerCase();
      const itemsStr = h.items.join(" ").toLowerCase();
      const mealStr = h.mealType.toLowerCase();
      const q = search.toLowerCase();
      return dateStr.includes(q) || itemsStr.includes(q) || mealStr.includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout role="student" navItems={studentNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Detailed Meal History</h2>
        <p className="text-sm text-slate-500">Track selections, served items, and attendance records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow transition-shadow">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Days Logged</div>
          <div className="text-2xl font-extrabold text-slate-800">{Math.ceil(totalMealsTracked / 3)} Days</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow transition-shadow">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meals Served</div>
          <div className="text-2xl font-extrabold text-emerald-600">{servedCount} Meals</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow transition-shadow">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meals Missed</div>
          <div className="text-2xl font-extrabold text-amber-600">{missedCount} Meals</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow transition-shadow">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance Rate</div>
          <div className="text-2xl font-extrabold text-indigo-600">{attendanceRate}%</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Search</label>
            <input
              placeholder="🔍 Search by date, food item (e.g. Rice, Dal)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Meal Type</label>
            <select
              value={mealFilter}
              onChange={(e) => setMealFilter(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50 text-sm font-medium text-slate-700"
            >
              <option value="all">All Meals</option>
              <option value="breakfast">🌅 Breakfast</option>
              <option value="lunch">☀️ Lunch</option>
              <option value="dinner">🌙 Dinner</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50 text-sm font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Served">✓ Served</option>
              <option value="Missed">✕ Missed</option>
              <option value="Not Taken">⏳ Not Taken</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Meal</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Items</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Served Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm font-medium">Fetching history...</p>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="font-semibold text-sm">No history records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting your search or filter settings</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {new Date(h.date + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold capitalize text-slate-700">
                        <span>{h.mealType === "breakfast" ? "🌅" : h.mealType === "lunch" ? "☀️" : "🌙"}</span>
                        <span>{h.mealType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                        h.status === "Served"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : h.status === "Missed"
                            ? "bg-red-50/70 text-red-700 border-red-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        <span>{h.status === "Served" ? "✓" : h.status === "Missed" ? "✖" : "⏳"}</span>
                        <span>{h.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {h.items.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {h.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No items selected</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {h.status === "Served" ? (
                        <div>
                          <div className="font-semibold text-slate-800">
                            ⏱️ {new Date(h.servedAt!).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Staff: {h.staffName}</div>
                        </div>
                      ) : h.status === "Missed" ? (
                        <span className="text-amber-600 font-medium">Scanned pass missing</span>
                      ) : (
                        <span className="text-slate-400">Meal skipped</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
