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

export default function StaffProfilePage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setUser(d.user || null));
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      setMsg(data.error || "Failed");
    }
  }

  return (
    <DashboardLayout role="staff" navItems={staffNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-sm text-slate-500">Manage your account</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user?.name}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="inline-block px-2.5 py-0.5 bg-green-50 text-green-600 rounded-full text-xs font-medium mt-1 capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold mb-4">🔒 Change Password</h3>
          {msg && (
            <div className={`px-4 py-2 rounded-xl text-sm mb-4 ${msg.includes("success") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
              {msg}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required minLength={6} />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
