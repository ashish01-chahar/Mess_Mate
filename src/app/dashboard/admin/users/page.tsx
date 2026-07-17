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

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "student",
    course: "B.Tech CSE", year: 1, hostel: "Hostel A", rollNumber: "", designation: "Cook",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsersList(data.users || []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("User created successfully!");
      setForm({ name: "", email: "", password: "", role: "student", course: "B.Tech CSE", year: 1, hostel: "Hostel A", rollNumber: "", designation: "Cook" });
      loadUsers();
      setTimeout(() => setShowCreate(false), 1000);
    } else {
      setMsg(data.error || "Failed");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    loadUsers();
  }

  const filtered = usersList.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin" navItems={adminNav}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-slate-500">Create and manage students, staff, and admin accounts</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {showCreate ? "✕ Close" : "+ Create User"}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 fade-in">
          <h3 className="font-semibold mb-4">Create New User</h3>
          {msg && <div className={`px-4 py-2 rounded-xl text-sm mb-4 ${msg.includes("success") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>{msg}</div>}
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none">
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {form.role === "student" && (
              <>
                <input placeholder="Roll Number" value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
                <input placeholder="Course" value={form.course} onChange={e => setForm({...form, course: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
                <select value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none">
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                </select>
                <input placeholder="Hostel" value={form.hostel} onChange={e => setForm({...form, hostel: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
              </>
            )}
            {form.role === "staff" && (
              <input placeholder="Designation" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
            )}
            <div className="md:col-span-2">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          placeholder="🔍 Search users by name, email, or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                        u.role === "admin" ? "bg-red-500" : u.role === "staff" ? "bg-green-500" : "bg-blue-500"
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.role === "admin" ? "bg-red-50 text-red-600" : u.role === "staff" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
