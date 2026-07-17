import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mealSelections, mealServed, users, feedback } from "@/db/schema";
import { eq, and, sql, gte, lte, count } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me || (me.role !== "admin" && me.role !== "staff")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Total students
  const [{ value: totalStudents }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "student"));

  if (date) {
    // Daily report
    const selections = await db.select().from(mealSelections).where(eq(mealSelections.date, date));
    const bfCount = selections.filter(s => s.breakfast).length;
    const lnCount = selections.filter(s => s.lunch).length;
    const dnCount = selections.filter(s => s.dinner).length;
    const totalMeals = bfCount + lnCount + dnCount;
    const maxMeals = totalStudents * 3;
    const saved = maxMeals - totalMeals;

    // Served counts
    const served = await db.select().from(mealServed).where(eq(mealServed.date, date));
    const servedBreakfast = served.filter(s => s.mealType === "breakfast").length;
    const servedLunch = served.filter(s => s.mealType === "lunch").length;
    const servedDinner = served.filter(s => s.mealType === "dinner").length;

    // Average feedback
    const fb = await db.select().from(feedback).where(eq(feedback.date, date));
    const avgRating = fb.length > 0 ? fb.reduce((a, b) => a + b.rating, 0) / fb.length : 0;

    return NextResponse.json({
      report: {
        date,
        totalStudents,
        breakfastCount: bfCount,
        lunchCount: lnCount,
        dinnerCount: dnCount,
        totalMeals,
        foodSaved: saved,
        foodSavedPercent: maxMeals > 0 ? Math.round((saved / maxMeals) * 100) : 0,
        servedBreakfast,
        servedLunch,
        servedDinner,
        avgRating: Math.round(avgRating * 10) / 10,
      }
    });
  }

  if (from && to) {
    // Monthly / range report
    const selections = await db.select().from(mealSelections)
      .where(and(gte(mealSelections.date, from), lte(mealSelections.date, to)));

    const dailyMap = new Map<string, { b: number; l: number; d: number }>();
    for (const s of selections) {
      const day = s.date;
      if (!dailyMap.has(day)) dailyMap.set(day, { b: 0, l: 0, d: 0 });
      const entry = dailyMap.get(day)!;
      if (s.breakfast) entry.b++;
      if (s.lunch) entry.l++;
      if (s.dinner) entry.d++;
    }

    const dailyReports = Array.from(dailyMap.entries()).map(([d, counts]) => ({
      date: d,
      breakfast: counts.b,
      lunch: counts.l,
      dinner: counts.d,
      total: counts.b + counts.l + counts.d,
      saved: (totalStudents * 3) - (counts.b + counts.l + counts.d),
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ reports: dailyReports, totalStudents });
  }

  return NextResponse.json({ error: "Provide date or from/to" }, { status: 400 });
}
