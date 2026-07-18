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

interface Report {
  totalStudents: number;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  totalMeals: number;
  foodSaved: number;
  foodSavedPercent: number;
  servedBreakfast: number;
  servedLunch: number;
  servedDinner: number;
}

export default function StaffReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    fetch(`/api/admin/reports?date=${date}`)
      .then(r => r.json())
      .then(d => setReport(d.report || null));
  }, [date]);

  return (
    <DashboardLayout role="staff" navItems={staffNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Daily Reports</h2>
        <p className="text-sm text-slate-500">View meal counts and serving statistics</p>
      </div>

      <div className="mb-6">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white" />
      </div>

      {report ? (
        <div className="space-y-6 fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="text-amber-500 text-sm font-medium mb-1">🌅 Breakfast</div>
              <div className="text-3xl font-bold">{report.breakfastCount}</div>
              <div className="text-sm text-slate-500 mt-1">Served: {report.servedBreakfast}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="text-green-500 text-sm font-medium mb-1">☀️ Lunch</div>
              <div className="text-3xl font-bold">{report.lunchCount}</div>
              <div className="text-sm text-slate-500 mt-1">Served: {report.servedLunch}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="text-indigo-500 text-sm font-medium mb-1">🌙 Dinner</div>
              <div className="text-3xl font-bold">{report.dinnerCount}</div>
              <div className="text-sm text-slate-500 mt-1">Served: {report.servedDinner}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-3">🌱 Food Saved</h3>
              <div className="text-4xl font-bold mb-1">{report.foodSaved} plates</div>
              <div className="text-emerald-100">{report.foodSavedPercent}% waste reduced</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-semibold mb-3">📊 Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Students</span>
                  <span className="font-medium">{report.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Meals Selected</span>
                  <span className="font-medium">{report.totalMeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Possible Meals</span>
                  <span className="font-medium">{report.totalStudents * 3}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border">No data for this date</div>
      )}
    </DashboardLayout>
  );
}
