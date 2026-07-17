"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";

const ReportCharts = dynamic(() => import("@/components/ReportCharts"), { ssr: false });

const adminNav = [
  { label: "Dashboard", href: "/dashboard/admin", icon: "📊" },
  { label: "Users", href: "/dashboard/admin/users", icon: "👥" },
  { label: "Menu", href: "/dashboard/admin/menu", icon: "🍽️" },
  { label: "Notifications", href: "/dashboard/admin/notifications", icon: "🔔" },
  { label: "Reports", href: "/dashboard/admin/reports", icon: "📈" },
  { label: "Holidays", href: "/dashboard/admin/holidays", icon: "📅" },
];

interface DailyReport {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
  saved: number;
}

export default function ReportsPage() {
  const [mode, setMode] = useState<"daily" | "range">("daily");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [dailyReport, setDailyReport] = useState<Record<string, number | string> | null>(null);
  const [rangeReports, setRangeReports] = useState<DailyReport[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (mode === "daily") loadDaily();
    else loadRange();
  }, [mode, date, from, to]);

  async function loadDaily() {
    const res = await fetch(`/api/admin/reports?date=${date}`);
    const data = await res.json();
    setDailyReport(data.report || null);
  }

  async function loadRange() {
    const res = await fetch(`/api/admin/reports?from=${from}&to=${to}`);
    const data = await res.json();
    setRangeReports(data.reports || []);
    setTotalStudents(data.totalStudents || 0);
  }

  return (
    <DashboardLayout role="admin" navItems={adminNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-sm text-slate-500">Daily and monthly reports with food waste analytics</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("daily")}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${mode === "daily" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          📅 Daily Report
        </button>
        <button
          onClick={() => setMode("range")}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${mode === "range" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          📊 Monthly Report
        </button>
      </div>

      {mode === "daily" ? (
        <div className="fade-in">
          <div className="mb-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white" />
          </div>

          {dailyReport ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="text-amber-500 text-sm font-medium mb-1">🌅 Breakfast</div>
                  <div className="text-3xl font-bold text-slate-900">{dailyReport.breakfastCount}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="text-green-500 text-sm font-medium mb-1">☀️ Lunch</div>
                  <div className="text-3xl font-bold text-slate-900">{dailyReport.lunchCount}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="text-indigo-500 text-sm font-medium mb-1">🌙 Dinner</div>
                  <div className="text-3xl font-bold text-slate-900">{dailyReport.dinnerCount}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="text-slate-500 text-sm font-medium mb-1">🍽️ Total Meals</div>
                  <div className="text-3xl font-bold text-slate-900">{dailyReport.totalMeals}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">🌱 Food Waste Reduction</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/15 rounded-xl p-4">
                      <div className="text-3xl font-bold">{dailyReport.foodSaved}</div>
                      <div className="text-sm opacity-80">Plates Saved</div>
                    </div>
                    <div className="bg-white/15 rounded-xl p-4">
                      <div className="text-3xl font-bold">{dailyReport.foodSavedPercent}%</div>
                      <div className="text-sm opacity-80">Waste Reduced</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <h3 className="font-semibold mb-3">📋 Serving Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Breakfast Served</span>
                      <span className="font-medium">{dailyReport.servedBreakfast} / {dailyReport.breakfastCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Lunch Served</span>
                      <span className="font-medium">{dailyReport.servedLunch} / {dailyReport.lunchCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Dinner Served</span>
                      <span className="font-medium">{dailyReport.servedDinner} / {dailyReport.dinnerCount}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between">
                      <span className="text-sm text-slate-600">Avg Feedback Rating</span>
                      <span className="font-medium">⭐ {dailyReport.avgRating}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border">No data for this date</div>
          )}
        </div>
      ) : (
        <div className="fade-in">
          <div className="flex gap-4 mb-6">
            <div>
              <label className="text-xs text-slate-500 block mb-1">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white" />
            </div>
          </div>

          {rangeReports.length > 0 && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
                <h3 className="font-semibold mb-4">📊 Meal Selection Trends</h3>
                <ReportCharts data={rangeReports} />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Breakfast</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Lunch</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Dinner</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rangeReports.map(r => (
                      <tr key={r.date} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">{r.date}</td>
                        <td className="px-4 py-3 text-sm text-center">{r.breakfast}</td>
                        <td className="px-4 py-3 text-sm text-center">{r.lunch}</td>
                        <td className="px-4 py-3 text-sm text-center">{r.dinner}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{r.total}</td>
                        <td className="px-4 py-3 text-sm text-center text-emerald-600 font-medium">{r.saved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {rangeReports.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border">No data for this period</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
