"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const studentNav = [
  { label: "Dashboard", href: "/dashboard/student", icon: "🏠" },
  { label: "Meal History", href: "/dashboard/student/history", icon: "📋" },
  { label: "Notifications", href: "/dashboard/student/notifications", icon: "🔔" },
  { label: "QR Pass", href: "/dashboard/student/qr", icon: "📱" },
  { label: "Feedback", href: "/dashboard/student/feedback", icon: "⭐" },
  { label: "Profile", href: "/dashboard/student/profile", icon: "👤" },
];

interface FoodItem {
  id: number;
  name: string;
}

interface MealItem {
  id: number;
  mealType: string;
  items: FoodItem[];
  published: boolean;
}

interface ServingStatus {
  served: boolean;
  servedAt: string | null;
  staffName: string | null;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

export default function StudentDashboard() {
  const [menuItems, setMenuItems] = useState<MealItem[]>([]);
  const [selections, setSelections] = useState<Record<number, number[]>>({}); // mealId -> list of foodItemIds
  const [tempSelections, setTempSelections] = useState<Record<number, number[]>>({});
  const [servings, setServings] = useState<Record<string, ServingStatus>>({});
  const [deadlines, setDeadlines] = useState<Record<string, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState("");
  const [loadingMealId, setLoadingMealId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/meals/select?date=${today}`);
      const data = await res.json();
      if (res.ok) {
        setMenuItems(data.menu || []);
        setSelections(data.selections || {});
        setTempSelections(JSON.parse(JSON.stringify(data.selections || {})));
        setServings(data.servings || {});
        setDeadlines(data.deadlines || { breakfast: false, lunch: false, dinner: false });
      }
    } catch (e) {
      showToast("Failed to load today's meal selection", "error");
    }
  }, [today]);

  useEffect(() => {
    let active = true;
    // Fetch User
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user && active) setUserName(d.user.name);
      });

    // Fetch Selections & Menu
    Promise.resolve().then(() => {
      if (active) loadData();
    });

    // Fetch Notifications
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (active) setNotifications((d.notifications || []).slice(0, 5));
      });

    return () => {
      active = false;
    };
  }, [today, loadData]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleCheckboxChange(mealId: number, itemId: number, checked: boolean) {
    const current = tempSelections[mealId] || [];
    let updated;
    if (checked) {
      updated = [...current, itemId];
    } else {
      updated = current.filter((id) => id !== itemId);
    }
    setTempSelections({
      ...tempSelections,
      [mealId]: updated,
    });
  }

  async function saveSelection(mealId: number) {
    setLoadingMealId(mealId);
    const chosenItemIds = tempSelections[mealId] || [];

    try {
      const res = await fetch("/api/meals/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          mealId,
          foodItemIds: chosenItemIds,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          chosenItemIds.length > 0
            ? "Meal items saved successfully!"
            : "Meal cancelled successfully!",
          "success"
        );
        // Refresh selection data
        loadData();
      } else {
        showToast(data.error || "Failed to save selection", "error");
      }
    } catch (err) {
      showToast("Network error. Failed to save selection.", "error");
    } finally {
      setLoadingMealId(null);
    }
  }

  const mealConfig = [
    { key: "breakfast" as const, icon: "🌅", label: "Breakfast", time: "7:30 AM - 9:00 AM", deadline: "9:00 AM", color: "amber" },
    { key: "lunch" as const, icon: "☀️", label: "Lunch", time: "12:30 PM - 2:00 PM", deadline: "1:00 PM", color: "green" },
    { key: "dinner" as const, icon: "🌙", label: "Dinner", time: "7:30 PM - 9:00 PM", deadline: "8:00 PM", color: "indigo" },
  ];

  return (
    <DashboardLayout role="student" navItems={studentNav}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all ${
          toast.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Welcome */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome, {userName || "Student"}! 👋</h2>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-indigo-700 text-xs font-semibold">
          📍 Quick Check cutoff: BF (9 AM) • LN (1 PM) • DN (8 PM)
        </div>
      </div>

      {/* Meal Selection Cards */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {mealConfig.map(meal => {
          const menuItem = menuItems.find(m => m.mealType === meal.key);
          const mealId = menuItem?.id;
          const isPast = deadlines[meal.key];
          const serving = servings[meal.key];
          const isServed = serving?.served;

          const savedItems = mealId ? selections[mealId] || [] : [];
          const currentItems = mealId ? tempSelections[mealId] || [] : [];
          const hasChanges = mealId && JSON.stringify(savedItems.sort()) !== JSON.stringify(currentItems.sort());

          return (
            <div key={meal.key} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
              savedItems.length > 0 && !isServed
                ? "border-indigo-300 ring-2 ring-indigo-100"
                : isServed
                  ? "border-emerald-300 ring-2 ring-emerald-50"
                  : "border-slate-100"
            }`}>
              {/* Header */}
              <div className={`px-5 py-4 ${
                meal.color === "amber" ? "bg-amber-50/50" : meal.color === "green" ? "bg-green-50/50" : "bg-indigo-50/50"
              } border-b border-slate-100`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meal.icon}</span>
                    <span className="font-semibold text-slate-800">{meal.label}</span>
                  </div>
                  {isServed ? (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-semibold">Served</span>
                  ) : savedItems.length > 0 ? (
                    <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-semibold">Selected</span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full font-semibold">Not Selected</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1.5 flex justify-between">
                  <span>⏰ {meal.time}</span>
                  <span className="font-medium text-red-500">Cutoff: {meal.deadline}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col justify-between h-[280px]">
                <div>
                  {menuItem ? (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {menuItem.items.map((food) => {
                        const isChecked = (tempSelections[menuItem.id] || []).includes(food.id);
                        const disabled = isPast || isServed;
                        return (
                          <label
                            key={food.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                              disabled ? "cursor-not-allowed text-slate-400" : "cursor-pointer"
                            } ${
                              isChecked
                                ? "bg-indigo-50/40 border-indigo-200 text-indigo-900"
                                : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={disabled}
                              onChange={(e) => handleCheckboxChange(menuItem.id, food.id, e.target.checked)}
                              className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 accent-indigo-600 disabled:opacity-50"
                            />
                            <span>{food.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-3xl mb-1">🍽️</p>
                      <p className="text-xs font-medium">No menu published yet</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isServed ? (
                    <div className="bg-emerald-50 rounded-xl p-2.5 text-emerald-800 text-xs">
                      <div className="font-semibold flex items-center gap-1">
                        <span>✓</span> Served Successfully
                      </div>
                      <div className="mt-0.5 opacity-90">
                        {serving.servedAt && new Date(serving.servedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} • Staff: {serving.staffName}
                      </div>
                    </div>
                  ) : isPast ? (
                    <div className="bg-slate-100 text-slate-500 rounded-xl p-2.5 text-center text-xs font-medium">
                      🔒 Deadline passed ({meal.deadline})
                    </div>
                  ) : menuItem ? (
                    <button
                      onClick={() => saveSelection(menuItem.id)}
                      disabled={loadingMealId === menuItem.id || !hasChanges}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                        !hasChanges
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                      }`}
                    >
                      {loadingMealId === menuItem.id
                        ? "Saving..."
                        : currentItems.length === 0 && savedItems.length > 0
                          ? "Cancel Meal Selection"
                          : "Save Selection"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Meal Status & Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Meal Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📊</span> Today&apos;s Meal Status
            </h3>
            <div className="space-y-3">
              {mealConfig.map(meal => {
                const menuItem = menuItems.find(m => m.mealType === meal.key);
                const mealId = menuItem?.id;
                const isSaved = mealId && (selections[mealId] || []).length > 0;
                const isServed = servings[meal.key]?.served;
                const itemsCount = mealId ? (selections[mealId] || []).length : 0;

                return (
                  <div key={meal.key} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meal.icon}</span>
                      <div>
                        <span className="text-sm font-semibold text-slate-800 block">{meal.label}</span>
                        {isSaved && !isServed && (
                          <span className="text-[11px] text-indigo-600 font-medium">
                            {itemsCount} items selected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isServed
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : isSaved
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                          : deadlines[meal.key]
                            ? "bg-slate-100 text-slate-500 border"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}>
                      {isServed
                        ? "Served"
                        : isSaved
                          ? "Pending Serving"
                          : deadlines[meal.key]
                            ? "Not Selected (Missed)"
                            : "Selection Pending"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1.5">
              <span>📋</span> Meal Checklist Guidelines
            </div>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Check precisely what food items you plan to consume. This allows the kitchen to cook exactly what is needed, reducing waste. Checkboxes are editable until cutoff times. To cancel your meal, uncheck all items and click Save before cutoff.
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>🔔</span> Recent Notifications
          </h3>
          {notifications.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No notifications yet</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {notifications.map(n => (
                <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <div className="font-semibold text-sm text-slate-800">{n.title}</div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-slate-400 mt-2 font-medium">
                    📅 {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
