"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const staffNav = [
  { label: "Dashboard", href: "/dashboard/staff", icon: "📊" },
  { label: "Today's Requests", href: "/dashboard/staff/requests", icon: "📋" },
  { label: "QR Scanner", href: "/dashboard/staff/scanner", icon: "📷" },
  { label: "Students", href: "/dashboard/staff/students", icon: "👥" },
  { label: "Reports", href: "/dashboard/staff/reports", icon: "📈" },
  { label: "Profile", href: "/dashboard/staff/profile", icon: "👤" },
];

interface RequestEntry {
  studentId: number;
  name: string;
  rollNumber: string;
  email: string;
  items: string[];
}

interface RequestsData {
  breakfast: RequestEntry[];
  lunch: RequestEntry[];
  dinner: RequestEntry[];
}

export default function TodayRequestsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [requests, setRequests] = useState<RequestsData>({ breakfast: [], lunch: [], dinner: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeMealTab, setActiveMealTab] = useState<"breakfast" | "lunch" | "dinner">("lunch");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setLoading(true);
    });
    fetch(`/api/staff/requests?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setRequests(d.requests || { breakfast: [], lunch: [], dinner: [] });
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  const activeRequests = requests[activeMealTab] || [];

  const filteredRequests = activeRequests.filter((req) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const nameMatch = req.name.toLowerCase().includes(q);
    const emailMatch = req.email.toLowerCase().includes(q);
    const rollMatch = req.rollNumber.toLowerCase().includes(q);
    const itemsMatch = req.items.some((item) => item.toLowerCase().includes(q));
    return nameMatch || emailMatch || rollMatch || itemsMatch;
  });

  const getMealIcon = (meal: string) => {
    if (meal === "breakfast") return "🌅";
    if (meal === "lunch") return "☀️";
    return "🌙";
  };

  return (
    <DashboardLayout role="staff" navItems={staffNav}>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Today&apos;s Meal Requests</h2>
          <p className="text-sm text-slate-500">View individual student selections grouped by meal</p>
        </div>
        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-sm font-semibold text-slate-700 shadow-sm"
          />
        </div>
      </div>

      {/* Meal Selection Tabs */}
      <div className="flex gap-2 mb-6">
        {(["breakfast", "lunch", "dinner"] as const).map((meal) => {
          const count = requests[meal]?.length || 0;
          return (
            <button
              key={meal}
              onClick={() => setActiveMealTab(meal)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm capitalize transition-all ${
                activeMealTab === meal
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/10"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{getMealIcon(meal)}</span>
              <span>{meal}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeMealTab === meal ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <input
          placeholder={`🔍 Search in ${activeMealTab} by student name, roll number, or selected food items...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
        />
      </div>

      {/* Requests Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-semibold text-sm">Loading requests list...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400 shadow-sm">
          <div className="text-5xl mb-3">🍽️</div>
          <h3 className="font-bold text-slate-700 text-sm">No meal requests found</h3>
          <p className="text-xs text-slate-500 mt-1">No selections found for {activeMealTab} on this date.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req.studentId}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{req.name}</h4>
                    <span className="text-xs font-semibold text-slate-400">Roll: {req.rollNumber}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                    {activeMealTab.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-4">{req.email}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Items</div>
                <div className="flex flex-wrap gap-1.5">
                  {req.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                    >
                      <span className="text-emerald-500">✔</span> {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
