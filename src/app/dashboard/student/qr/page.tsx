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

export default function QRPassPage() {
  const [qr, setQr] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/qr")
      .then(r => r.json())
      .then(d => {
        setQr(d.qr || null);
        setUserName(d.user?.name || "");
      });
  }, []);

  return (
    <DashboardLayout role="student" navItems={studentNav}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">QR Code Meal Pass</h2>
        <p className="text-sm text-slate-500">Show this QR code to mess staff for verification</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {userName.charAt(0) || "?"}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">{userName}</h3>
          <p className="text-sm text-slate-500 mb-6">Meal Pass</p>

          {qr ? (
            <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-100 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR Code" className="w-64 h-64" />
            </div>
          ) : (
            <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <p className="text-slate-400">Loading QR...</p>
            </div>
          )}

          <p className="text-sm text-slate-500">
            Present this QR code to the mess staff when collecting your meal.
          </p>

          <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-left">
            <div className="text-sm font-medium text-indigo-700 mb-1">📋 Instructions</div>
            <ul className="text-xs text-indigo-600 space-y-1">
              <li>• Show QR code at the mess counter</li>
              <li>• Staff will scan to verify your meal selection</li>
              <li>• Meal will be marked as served automatically</li>
              <li>• QR is unique to your account</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
