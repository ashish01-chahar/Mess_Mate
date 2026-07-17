"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const staffNav = [
  { label: "Dashboard", href: "/dashboard/staff", icon: "📊" },
  { label: "Students", href: "/dashboard/staff/students", icon: "👥" },
  { label: "Reports", href: "/dashboard/staff/reports", icon: "📈" },
  { label: "Profile", href: "/dashboard/staff/profile", icon: "👤" },
];

interface Counts {
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  servedBreakfast: number;
  servedLunch: number;
  servedDinner: number;
  pendingBreakfast: number;
  pendingLunch: number;
  pendingDinner: number;
}

interface MenuItem {
  id: number;
  mealType: string;
  foodItems: string[];
}

export default function StaffDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch(`/api/staff/counts?date=${today}`)
      .then(r => r.json())
      .then(d => setCounts(d));

    fetch(`/api/admin/menu?date=${today}`)
      .then(r => r.json())
      .then(d => setMenuItems(d.menu || []));
  }, [today]);

  const meals = [
    { key: "breakfast", icon: "🌅", label: "Breakfast", count: counts?.breakfastCount ?? 0, served: counts?.servedBreakfast ?? 0, pending: counts?.pendingBreakfast ?? 0, color: "amber" },
    { key: "lunch", icon: "☀️", label: "Lunch", count: counts?.lunchCount ?? 0, served: counts?.servedLunch ?? 0, pending: counts?.pendingLunch ?? 0, color: "green" },
    { key: "dinner", icon: "🌙", label: "Dinner", count: counts?.dinnerCount ?? 0, served: counts?.servedDinner ?? 0, pending: counts?.pendingDinner ?? 0, color: "indigo" },
  ];

  const totalSelected = (counts?.breakfastCount ?? 0) + (counts?.lunchCount ?? 0) + (counts?.dinnerCount ?? 0);
  const totalServed = (counts?.servedBreakfast ?? 0) + (counts?.servedLunch ?? 0) + (counts?.servedDinner ?? 0);

  return (
    <DashboardLayout role="staff" navItems={staffNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Staff Dashboard</h2>
        <p className="text-sm text-slate-500">
          Today&apos;s meal operations • {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <div className="text-sm text-slate-500 mb-1">Total Selected</div>
          <div className="text-3xl font-bold text-slate-900">{totalSelected}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <div className="text-sm text-slate-500 mb-1">Total Served</div>
          <div className="text-3xl font-bold text-emerald-600">{totalServed}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <div className="text-sm text-slate-500 mb-1">Pending</div>
          <div className="text-3xl font-bold text-amber-600">{totalSelected - totalServed}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <div className="text-sm text-slate-500 mb-1">Completion</div>
          <div className="text-3xl font-bold text-indigo-600">
            {totalSelected > 0 ? Math.round((totalServed / totalSelected) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Meal Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {meals.map(meal => {
          const progress = meal.count > 0 ? Math.round((meal.served / meal.count) * 100) : 0;
          return (
            <div key={meal.key} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{meal.icon}</span>
                <h3 className="font-semibold text-lg">{meal.label}</h3>
              </div>

              <div className="text-4xl font-bold text-slate-900 mb-1">{meal.count}</div>
              <div className="text-sm text-slate-500 mb-4">Students Selected</div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    meal.color === "amber" ? "bg-amber-500" : meal.color === "green" ? "bg-green-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">✓ {meal.served} served</span>
                <span className="text-amber-600">⏳ {meal.pending} pending</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Menu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold mb-4">🍽️ Today&apos;s Menu</h3>
        {menuItems.length === 0 ? (
          <p className="text-slate-400 text-sm">No menu published for today</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-50">
                <div className="font-medium text-sm capitalize text-indigo-600 mb-2">
                  {item.mealType === "breakfast" ? "🌅" : item.mealType === "lunch" ? "☀️" : "🌙"} {item.mealType}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(item.foodItems as string[]).map((food, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white rounded-lg text-sm text-slate-700 border">{food}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
