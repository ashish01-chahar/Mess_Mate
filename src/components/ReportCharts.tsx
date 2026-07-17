"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

interface DataPoint {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
  saved: number;
}

const COLORS = ["#f59e0b", "#10b981", "#6366f1", "#ef4444"];

export default function ReportCharts({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) return null;

  const formatted = data.map(d => ({ ...d, date: d.date.slice(5) }));

  // Totals for pie
  const totalB = data.reduce((a, b) => a + b.breakfast, 0);
  const totalL = data.reduce((a, b) => a + b.lunch, 0);
  const totalD = data.reduce((a, b) => a + b.dinner, 0);
  const pieData = [
    { name: "Breakfast", value: totalB },
    { name: "Lunch", value: totalL },
    { name: "Dinner", value: totalD },
  ];

  return (
    <div className="space-y-8">
      {/* Line Chart */}
      <div>
        <h4 className="text-sm font-medium text-slate-500 mb-3">Meal Selection Trend</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              <Legend />
              <Line type="monotone" dataKey="breakfast" stroke="#f59e0b" strokeWidth={2} dot={false} name="Breakfast" />
              <Line type="monotone" dataKey="lunch" stroke="#10b981" strokeWidth={2} dot={false} name="Lunch" />
              <Line type="monotone" dataKey="dinner" stroke="#6366f1" strokeWidth={2} dot={false} name="Dinner" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar + Pie */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-3">Food Saved (Plates/Day)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: "12px" }} />
                <Bar dataKey="saved" fill="#10b981" radius={[4, 4, 0, 0]} name="Plates Saved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-3">Meal Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
