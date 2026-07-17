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

interface Selection {
  id: number;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export default function MealHistoryPage() {
  const [selections, setSelections] = useState<Selection[]>([]);

  useEffect(() => {
    fetch("/api/meals/history")
      .then(r => r.json())
      .then(d => setSelections(d.selections || []));
  }, []);

  const totalMeals = selections.reduce((acc, s) => {
    return acc + (s.breakfast ? 1 : 0) + (s.lunch ? 1 : 0) + (s.dinner ? 1 : 0);
  }, 0);

  return (
    <DashboardLayout role="student" navItems={studentNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Meal History</h2>
        <p className="text-sm text-slate-500">Your past meal selections and attendance</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{selections.length}</div>
          <div className="text-xs text-slate-500">Days Tracked</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{totalMeals}</div>
          <div className="text-xs text-slate-500">Total Meals</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {selections.length > 0 ? (totalMeals / selections.length).toFixed(1) : "0"}
          </div>
          <div className="text-xs text-slate-500">Avg/Day</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">🌅 Breakfast</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">☀️ Lunch</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">🌙 Dinner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {selections.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-sm font-medium">
                  {new Date(s.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.breakfast ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                    {s.breakfast ? "✓ Yes" : "✕ No"}
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.lunch ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                    {s.lunch ? "✓ Yes" : "✕ No"}
                  </span>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.dinner ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                    {s.dinner ? "✓ Yes" : "✕ No"}
                  </span>
                </td>
              </tr>
            ))}
            {selections.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No meal history yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
