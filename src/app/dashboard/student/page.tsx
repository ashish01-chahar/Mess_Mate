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

interface MenuItem {
  id: number;
  mealType: string;
  foodItems: string[];
}

interface Selection {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

interface Deadlines {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

export default function StudentDashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selection, setSelection] = useState<Selection>({ breakfast: false, lunch: false, dinner: false });
  const [deadlines, setDeadlines] = useState<Deadlines>({ breakfast: false, lunch: false, dinner: false });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    // Get user
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setUserName(d.user.name);
    });

    // Get menu
    fetch(`/api/admin/menu?date=${today}`)
      .then(r => r.json())
      .then(d => setMenuItems(d.menu || []));

    // Get selections
    fetch(`/api/meals/select?date=${today}`)
      .then(r => r.json())
      .then(d => {
        setSelection(d.selection || { breakfast: false, lunch: false, dinner: false });
        setDeadlines(d.deadlines || { breakfast: false, lunch: false, dinner: false });
      });

    // Get notifications
    fetch("/api/admin/notifications")
      .then(r => r.json())
      .then(d => setNotifications((d.notifications || []).slice(0, 5)));
  }, [today]);

  async function toggleMeal(mealType: "breakfast" | "lunch" | "dinner") {
    setLoading(mealType);
    const newVal = !selection[mealType];
    const res = await fetch("/api/meals/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, mealType, selected: newVal }),
    });
    if (res.ok) {
      setSelection({ ...selection, [mealType]: newVal });
    }
    setLoading(null);
  }

  const mealConfig = [
    { key: "breakfast" as const, icon: "🌅", label: "Breakfast", time: "7:30 AM - 9:00 AM", deadline: "7:00 AM", color: "amber" },
    { key: "lunch" as const, icon: "☀️", label: "Lunch", time: "12:30 PM - 2:00 PM", deadline: "11:00 AM", color: "green" },
    { key: "dinner" as const, icon: "🌙", label: "Dinner", time: "7:30 PM - 9:00 PM", deadline: "5:00 PM", color: "indigo" },
  ];

  return (
    <DashboardLayout role="student" navItems={studentNav}>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Welcome, {userName || "Student"}! 👋</h2>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Meal Selection Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {mealConfig.map(meal => {
          const menuItem = menuItems.find(m => m.mealType === meal.key);
          const isSelected = selection[meal.key];
          const isPast = deadlines[meal.key];

          return (
            <div key={meal.key} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${isSelected ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-100"}`}>
              <div className={`px-5 py-3 ${
                meal.color === "amber" ? "bg-amber-50" : meal.color === "green" ? "bg-green-50" : "bg-indigo-50"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meal.icon}</span>
                    <span className="font-semibold">{meal.label}</span>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">Selected</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">⏰ {meal.time}</div>
              </div>

              <div className="p-5">
                {menuItem ? (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(menuItem.foodItems as string[]).map((food, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100">{food}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mb-4">No menu published yet</p>
                )}

                <button
                  onClick={() => toggleMeal(meal.key)}
                  disabled={isPast || loading === meal.key}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isPast
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : isSelected
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {loading === meal.key ? "..." : isPast ? `Deadline passed (${meal.deadline})` : isSelected ? "Cancel Meal" : `Select ${meal.label}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Meal Status & Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Meal Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">📊 Today&apos;s Meal Status</h3>
          <div className="space-y-3">
            {mealConfig.map(meal => (
              <div key={meal.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{meal.icon}</span>
                  <span className="text-sm font-medium">{meal.label}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selection[meal.key]
                    ? "bg-green-100 text-green-700"
                    : deadlines[meal.key]
                      ? "bg-slate-100 text-slate-500"
                      : "bg-amber-100 text-amber-700"
                }`}>
                  {selection[meal.key] ? "✓ Selected" : deadlines[meal.key] ? "Not Selected" : "Pending"}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
            <div className="text-sm font-medium text-indigo-700 mb-1">⏰ Selection Deadlines</div>
            <div className="text-xs text-indigo-600 space-y-0.5">
              <div>Breakfast: Before 7:00 AM</div>
              <div>Lunch: Before 11:00 AM</div>
              <div>Dinner: Before 5:00 PM</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">🔔 Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No notifications</p>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-medium text-sm text-slate-800">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{n.message}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
