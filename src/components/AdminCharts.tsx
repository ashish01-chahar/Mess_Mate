"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DataPoint {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  saved: number;
}

export default function AdminCharts({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>No data available for this period</p>
      </div>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    date: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
          <Legend />
          <Bar dataKey="breakfast" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Breakfast" />
          <Bar dataKey="lunch" fill="#10b981" radius={[4, 4, 0, 0]} name="Lunch" />
          <Bar dataKey="dinner" fill="#6366f1" radius={[4, 4, 0, 0]} name="Dinner" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
