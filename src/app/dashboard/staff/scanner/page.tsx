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

interface StudentDetails {
  name: string;
  email: string;
  rollNumber: string;
  course: string;
  hostel: string;
}

interface ChecklistItem {
  id: number;
  name: string;
  selected: boolean;
}

interface ScanResult {
  studentDetails: StudentDetails;
  mealId: number;
  mealType: string;
  date: string;
  menuPublished: boolean;
  hasSelectedMeal: boolean;
  items: ChecklistItem[];
  served: boolean;
  servedAt: string | null;
}

interface DemoStudent {
  studentId: number;
  name: string;
  email: string;
}

export default function QRScannerPage() {
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner">(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return "breakfast";
    if (hour >= 11 && hour < 16) return "lunch";
    return "dinner";
  });
  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [demoStudents, setDemoStudents] = useState<DemoStudent[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Fetch demo students who selected active meal to simulate scans
  useEffect(() => {
    fetch(`/api/staff/students?date=${today}&mealType=${mealType}`)
      .then((r) => r.json())
      .then((d) => setDemoStudents(d.students || []));
  }, [mealType, today]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Handle manual paste or QR code scan simulation
  async function handleVerify(studentId: number) {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch(`/api/qr/verify?studentId=${studentId}&mealType=${mealType}&date=${today}`);
      const data = await res.json();
      if (res.ok) {
        setScanResult(data);
        setActiveStudentId(studentId);
        showToast("QR verified successfully!", "success");
      } else {
        showToast(data.error || "Verification failed", "error");
      }
    } catch (e) {
      showToast("Network error during verification", "error");
    } finally {
      setScanning(false);
    }
  }

  // Handle manual text verification
  function handleManualSubmit() {
    try {
      const parsed = JSON.parse(qrInput.trim());
      if (parsed && parsed.id) {
        handleVerify(parsed.id);
      } else {
        showToast("Invalid QR Format. Must contain student id.", "error");
      }
    } catch (e) {
      showToast("Could not parse JSON. Paste correct student pass data.", "error");
    }
  }

  // Handle food distributed submission
  async function handleFoodDistributed() {
    if (!activeStudentId || !scanResult) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/staff/serve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: activeStudentId,
          date: today,
          mealType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Meal served successfully!", "success");
        // Reload details to show served state
        handleVerify(activeStudentId);
        // Refresh student demo list
        fetch(`/api/staff/students?date=${today}&mealType=${mealType}`)
          .then((r) => r.json())
          .then((d) => setDemoStudents(d.students || []));
      } else {
        showToast(data.error || "Failed to mark meal served", "error");
      }
    } catch (e) {
      showToast("Network error marking meal served", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout role="staff" navItems={staffNav}>
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

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">QR Pass Verification</h2>
        <p className="text-sm text-slate-500">Scan student passes, verify checked items, and record servings</p>
      </div>

      {/* Meal Selection Tabs */}
      <div className="flex gap-2 mb-6">
        {["breakfast", "lunch", "dinner"].map((type) => (
          <button
            key={type}
            onClick={() => {
              setMealType(type as any);
              setScanResult(null);
              setActiveStudentId(null);
            }}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm capitalize transition-all ${
              mealType === type
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {type === "breakfast" ? "🌅" : type === "lunch" ? "☀️" : "🌙"} {type}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Viewfinder & Input */}
        <div className="lg:col-span-5 space-y-6">
          {/* Visual Scanner Viewfinder */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 relative aspect-square max-w-sm mx-auto flex flex-col justify-between p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_100%)]"></div>
            
            {/* Viewfinder Corners */}
            <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl"></div>
            <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr"></div>
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl"></div>
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br"></div>

            {/* Red Scanning line */}
            <div className="absolute left-6 right-6 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse top-[50%] transform -translate-y-1/2"></div>

            <div className="z-10 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
              Camera Viewfinder
            </div>

            <div className="z-10 flex flex-col items-center justify-center py-12">
              <span className="text-5xl animate-bounce mb-3">📷</span>
              <p className="text-sm font-semibold text-slate-400">Scanner Standby</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">Simulate scans by choosing a student below or pasting data</p>
            </div>

            <div className="z-10 text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              MessMate QR Verification System v2.0
            </div>
          </div>

          {/* Manual Text Paste Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3">⌨️ Paste QR Payload Manual</h3>
            <textarea
              placeholder='e.g. {"id": 2, "name": "Priya Patel", "email": "priya@messmate.com"}'
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono focus:border-indigo-500 outline-none resize-none mb-3"
            />
            <button
              onClick={handleManualSubmit}
              className="w-full bg-slate-800 text-white py-2 rounded-xl text-xs font-semibold hover:bg-slate-900 active:scale-[0.98] transition-all"
            >
              Verify Payload String
            </button>
          </div>
        </div>

        {/* Right: Results / Student Selection checklist */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scan result display */}
          {scanning ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
              <p className="font-bold text-sm text-slate-700">Verifying student selections...</p>
            </div>
          ) : scanResult ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 relative overflow-hidden">
              {scanResult.served && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest px-6 py-1.5 transform rotate-0 rounded-bl-2xl">
                  ✓ Served
                </div>
              )}

              {/* Student Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 text-xl font-bold">
                  {scanResult.studentDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">{scanResult.studentDetails.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-semibold text-slate-500">
                    <span>Enrollment: <strong className="text-slate-700">{scanResult.studentDetails.rollNumber}</strong></span>
                    <span>•</span>
                    <span>Hostel: <strong className="text-slate-700">{scanResult.studentDetails.hostel}</strong></span>
                    <span>•</span>
                    <span className="capitalize">{scanResult.mealType}</span>
                  </div>
                </div>
              </div>

              {/* Checklist details */}
              <div className="border-t border-slate-100 pt-5 mb-6">
                <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-3">Student Selection Checklist</h4>

                {!scanResult.menuPublished ? (
                  <p className="text-xs text-amber-600 font-semibold bg-amber-50 rounded-xl p-3">
                    ⚠️ No menu published for {scanResult.mealType} today!
                  </p>
                ) : !scanResult.hasSelectedMeal ? (
                  <p className="text-xs text-red-600 font-semibold bg-red-50 rounded-xl p-3">
                    ✕ Student has NOT selected this meal today. DO NOT serve.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-2">
                    {scanResult.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold ${
                          item.selected
                            ? "bg-emerald-50/40 border-emerald-200 text-emerald-950"
                            : "bg-slate-50/50 border-slate-200/50 text-slate-400/80"
                        }`}
                      >
                        <span>{item.name}</span>
                        <span className={`text-base font-bold ${item.selected ? "text-emerald-600" : "text-slate-300"}`}>
                          {item.selected ? "✔" : "✖"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {scanResult.hasSelectedMeal && (
                <div className="border-t border-slate-100 pt-5">
                  {scanResult.served ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs">
                      <div className="font-bold flex items-center gap-1.5 mb-0.5">
                        <span>✓</span> Food Distributed Successfully
                      </div>
                      <div className="opacity-95">
                        Time: {scanResult.servedAt && new Date(scanResult.servedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleFoodDistributed}
                      disabled={submitting}
                      className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? "Processing..." : "Mark Food Distributed"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-5xl mb-3">📱</div>
              <h3 className="font-bold text-slate-700 text-sm">Waiting for QR Scan</h3>
              <p className="text-xs text-slate-500 mt-1">Select a student from the simulation list below or paste a pass payload</p>
            </div>
          )}

          {/* Quick simulation lists */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3">🧪 Quick Scan Simulation List (Today&apos;s Selections)</h3>
            {demoStudents.length === 0 ? (
              <p className="text-xs text-slate-400">No students have selections for {mealType} today.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                {demoStudents.map((student) => (
                  <button
                    key={student.studentId}
                    onClick={() => handleVerify(student.studentId)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      activeStudentId === student.studentId
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ⚡ {student.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
