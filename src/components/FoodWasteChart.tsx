"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface WasteData {
  name: string;
  selected: number;
  served: number;
  waste: number;
}

export default function FoodWasteChart({ data }: { data: WasteData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p className="text-sm font-medium">No waste analytics data available for today</p>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <Bar dataKey="selected" fill="#6366f1" radius={[4, 4, 0, 0]} name="Prepared (Selected)" />
          <Bar dataKey="served" fill="#10b981" radius={[4, 4, 0, 0]} name="Consumed (Served)" />
          <Bar dataKey="waste" fill="#ef4444" radius={[4, 4, 0, 0]} name="Wasted (Missed)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
