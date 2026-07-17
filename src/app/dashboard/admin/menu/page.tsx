"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const adminNav = [
  { label: "Dashboard", href: "/dashboard/admin", icon: "📊" },
  { label: "Users", href: "/dashboard/admin/users", icon: "👥" },
  { label: "Menu", href: "/dashboard/admin/menu", icon: "🍽️" },
  { label: "Notifications", href: "/dashboard/admin/notifications", icon: "🔔" },
  { label: "Reports", href: "/dashboard/admin/reports", icon: "📈" },
  { label: "Holidays", href: "/dashboard/admin/holidays", icon: "📅" },
];

interface MenuItem {
  id: number;
  date: string;
  mealType: string;
  foodItems: string[];
  published: boolean;
}

export default function MenuPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [mealType, setMealType] = useState("breakfast");
  const [foodInput, setFoodInput] = useState("");
  const [foods, setFoods] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadMenu();
  }, [selectedDate]);

  async function loadMenu() {
    const res = await fetch(`/api/admin/menu?date=${selectedDate}`);
    const data = await res.json();
    setMenuItems(data.menu || []);
  }

  function addFood() {
    if (foodInput.trim()) {
      setFoods([...foods, foodInput.trim()]);
      setFoodInput("");
    }
  }

  function removeFood(index: number) {
    setFoods(foods.filter((_, i) => i !== index));
  }

  async function handlePublish() {
    if (foods.length === 0) {
      setMsg("Add at least one food item");
      return;
    }
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, mealType, foodItems: foods, published: true }),
    });
    if (res.ok) {
      setMsg("Menu published successfully!");
      setFoods([]);
      loadMenu();
    } else {
      setMsg("Failed to publish menu");
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/menu?id=${id}`, { method: "DELETE" });
    loadMenu();
  }

  function editMenu(item: MenuItem) {
    setMealType(item.mealType);
    setFoods(item.foodItems as string[]);
  }

  const dayName = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" });

  return (
    <DashboardLayout role="admin" navItems={adminNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <p className="text-sm text-slate-500">Manage daily meal menus for breakfast, lunch, and dinner</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Create/Edit */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">📝 Add/Update Menu</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
            <div className="text-sm text-indigo-600 mt-1 font-medium">{dayName}</div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Meal Type</label>
            <div className="flex gap-2">
              {["breakfast", "lunch", "dinner"].map(type => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                    mealType === type
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type === "breakfast" ? "🌅" : type === "lunch" ? "☀️" : "🌙"} {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Food Items</label>
            <div className="flex gap-2">
              <input
                placeholder="e.g. Paneer Butter Masala"
                value={foodInput}
                onChange={e => setFoodInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFood())}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              />
              <button onClick={addFood} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700">+</button>
            </div>
            {foods.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {foods.map((f, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm flex items-center gap-1.5">
                    {f}
                    <button onClick={() => removeFood(i)} className="text-indigo-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {msg && <div className={`px-4 py-2 rounded-xl text-sm mb-4 ${msg.includes("success") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>{msg}</div>}

          <button onClick={handlePublish} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            Publish Menu
          </button>
        </div>

        {/* Right: Current Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">📋 Menu for {dayName}, {selectedDate}</h3>
          {menuItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">🍽️</div>
              <p>No menu items for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {["breakfast", "lunch", "dinner"].map(type => {
                const item = menuItems.find(m => m.mealType === type);
                if (!item) return null;
                return (
                  <div key={type} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium capitalize text-indigo-600">
                        {type === "breakfast" ? "🌅" : type === "lunch" ? "☀️" : "🌙"} {type}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editMenu(item)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(item.foodItems as string[]).map((food, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white rounded-lg text-sm text-slate-700 border border-slate-200">{food}</span>
                      ))}
                    </div>
                    <div className="mt-2">
                      {item.published ? (
                        <span className="text-xs text-green-600 font-medium">✓ Published</span>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Draft</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
