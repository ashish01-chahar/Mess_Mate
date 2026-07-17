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

interface FeedbackItem {
  id: number;
  date: string;
  mealType: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState("lunch");
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/meals/feedback");
    const data = await res.json();
    setItems(data.feedback || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/meals/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, mealType, rating, comment }),
    });
    if (res.ok) {
      setMsg("Feedback submitted! Thank you.");
      setComment("");
      setRating(4);
      load();
    }
  }

  return (
    <DashboardLayout role="student" navItems={studentNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Meal Feedback</h2>
        <p className="text-sm text-slate-500">Rate your meals and help improve the mess</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">⭐ Submit Feedback</h3>
          {msg && <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-sm mb-4">{msg}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Meal</label>
              <div className="flex gap-2">
                {["breakfast", "lunch", "dinner"].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                      mealType === type ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? "" : "opacity-30"}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Share your thoughts about the food..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Submit Feedback
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">📝 Your Recent Feedback</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {items.map(fb => (
              <div key={fb.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="capitalize font-medium text-sm">{fb.mealType}</span>
                    <span className="text-xs text-slate-400 ml-2">{fb.date}</span>
                  </div>
                  <div className="text-sm">{"⭐".repeat(fb.rating)}</div>
                </div>
                {fb.comment && <p className="text-sm text-slate-600 mt-2">{fb.comment}</p>}
              </div>
            ))}
            {items.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No feedback submitted yet</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
