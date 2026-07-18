"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const staffNav = [
  { label: "Dashboard", href: "/dashboard/staff", icon: "📊" },
  { label: "Today's Requests", href: "/dashboard/staff/requests", icon: "📋" },
  { label: "QR Scanner", href: "/dashboard/staff/scanner", icon: "📷" },
  { label: "Students", href: "/dashboard/staff/students", icon: "👥" },
  { label: "Reports", href: "/dashboard/staff/reports", icon: "📈" },
  { label: "Profile", href: "/dashboard/staff/profile", icon: "👤" },
];

interface StudentEntry {
  studentId: number;
  name: string;
  email: string;
  served: boolean;
}

export default function StaffStudentsPage() {
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [search, setSearch] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [tab, setTab] = useState<"all" | "pending" | "served">("all");
  const [serving, setServing] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadStudents = useCallback(async () => {
    const res = await fetch(`/api/staff/students?date=${today}&mealType=${mealType}&search=`);
    const data = await res.json();
    setStudents(data.students || []);
  }, [today, mealType]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadStudents();
    });
    return () => {
      active = false;
    };
  }, [loadStudents]);

  async function handleServe(studentId: number) {
    setServing(studentId);
    await fetch("/api/staff/serve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, date: today, mealType }),
    });
    setServing(null);
    loadStudents();
  }

  const filtered = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "pending") return !s.served;
    if (tab === "served") return s.served;
    return true;
  });

  const pendingCount = students.filter(s => !s.served).length;
  const servedCount = students.filter(s => s.served).length;

  return (
    <DashboardLayout role="staff" navItems={staffNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Student List</h2>
        <p className="text-sm text-slate-500">View and manage student meal servings for today</p>
      </div>

      {/* Meal Type Selector */}
      <div className="flex gap-2 mb-6">
        {["breakfast", "lunch", "dinner"].map(type => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm capitalize transition-all ${
              mealType === type ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {type === "breakfast" ? "🌅" : type === "lunch" ? "☀️" : "🌙"} {type}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{students.length}</div>
          <div className="text-xs text-slate-500">Total Selected</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{servedCount}</div>
          <div className="text-xs text-slate-500">Served</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-slate-500">Pending</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          placeholder="🔍 Search student by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white"
        />
        <div className="flex gap-2">
          {(["all", "pending", "served"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                tab === t ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t} {t === "pending" ? `(${pendingCount})` : t === "served" ? `(${servedCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500">{s.email}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      s.served ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {s.served ? "✓ Served" : "⏳ Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {!s.served && (
                      <button
                        onClick={() => handleServe(s.studentId)}
                        disabled={serving === s.studentId}
                        className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {serving === s.studentId ? "..." : "Mark Served"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
