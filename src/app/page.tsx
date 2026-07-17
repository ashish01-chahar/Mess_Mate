"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [creds, setCreds] = useState<Record<string, { email: string; password: string }> | null>(null);

  async function handleSeed() {
    setSeeding(true);
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    setSeeded(true);
    setSeeding(false);
    if (data.credentials) setCreds(data.credentials);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">M</div>
          <span className="text-xl font-bold text-indigo-900">MessMate</span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          Login →
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="fade-in">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              🌱 Reducing Food Waste with Technology
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Smart College<br />
              <span className="text-indigo-600">Mess Management</span><br />
              System
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              Transform your hostel mess operations. Students pre-select meals, kitchen prepares exact quantities. 
              Save food, reduce costs, eliminate queues.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push("/login")}
                className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-lg"
              >
                Get Started
              </button>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="bg-white text-indigo-600 border-2 border-indigo-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-all text-lg disabled:opacity-50"
              >
                {seeding ? "Setting up..." : seeded ? "✓ Demo Ready" : "Setup Demo Data"}
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="fade-in bg-white rounded-3xl shadow-2xl shadow-indigo-100 p-8 border border-indigo-100">
            <h3 className="text-lg font-semibold text-slate-700 mb-6">📊 Impact Dashboard</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">38%</div>
                <div className="text-sm text-emerald-700 mt-1">Food Saved</div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">₹2.4L</div>
                <div className="text-sm text-blue-700 mt-1">Cost Reduced</div>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">1000+</div>
                <div className="text-sm text-amber-700 mt-1">Students</div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">95%</div>
                <div className="text-sm text-purple-700 mt-1">Satisfaction</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Food Waste Reduction</span>
                <span className="text-indigo-100 text-sm">This Month</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div className="bg-white rounded-full h-3 w-[72%] transition-all duration-1000"></div>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>380 plates saved today</span>
                <span>72%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">How MessMate Works</h2>
          <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">A simple workflow that connects students, kitchen staff, and administrators</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: "📋", title: "Menu Published", desc: "Admin uploads daily menu with breakfast, lunch & dinner items" },
              { icon: "✅", title: "Meals Selected", desc: "Students pre-select meals before the deadline" },
              { icon: "🍳", title: "Exact Cooking", desc: "Kitchen prepares only the required quantity" },
              { icon: "📊", title: "Reports Generated", desc: "Analytics show savings, attendance & feedback" },
            ].map((step, i) => (
              <div key={i} className="text-center p-6 rounded-2xl hover:bg-indigo-50 transition-colors">
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-3">{i + 1}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Features for Every User</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 card-hover">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-2xl mb-4">👑</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Admin Portal</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>✓ Complete dashboard with analytics</li>
              <li>✓ User management (students & staff)</li>
              <li>✓ Menu management by date</li>
              <li>✓ Send notifications</li>
              <li>✓ Daily & monthly reports</li>
              <li>✓ Holiday management</li>
              <li>✓ Food waste analytics</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 card-hover">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Student Portal</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>✓ View today&apos;s menu</li>
              <li>✓ Select/cancel meals before deadline</li>
              <li>✓ QR code meal pass</li>
              <li>✓ Meal history</li>
              <li>✓ Feedback & ratings</li>
              <li>✓ Notifications</li>
              <li>✓ Profile management</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 card-hover">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl mb-4">👨‍🍳</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Staff Portal</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>✓ Real-time meal counts</li>
              <li>✓ Student search & verify</li>
              <li>✓ Mark meals as served</li>
              <li>✓ Pending/completed tracking</li>
              <li>✓ Generate meal slips</li>
              <li>✓ Daily reports</li>
              <li>✓ QR verification</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Demo Credentials */}
      {seeded && creds && (
        <section className="py-12 max-w-4xl mx-auto px-6 fade-in">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">🎉 Demo Data Created! Login Credentials:</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(creds).map(([role, c]) => (
                <div key={role} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="font-bold text-lg capitalize mb-2">{role}</div>
                  <div className="text-sm opacity-90">📧 {c.email}</div>
                  <div className="text-sm opacity-90">🔑 {c.password}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="mt-6 bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
            >
              Go to Login →
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="text-lg font-bold text-white">MessMate</span>
          </div>
          <p className="text-sm">Smart Mess Management System – Reducing Food Waste with Technology</p>
          <p className="text-xs mt-2">Built for B.Tech Major Project • © 2024</p>
        </div>
      </footer>
    </div>
  );
}
