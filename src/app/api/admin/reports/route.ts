import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, studentMealSelections, mealDistributionHistory, users, feedback } from "@/db/schema";
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
    // Fetch unique selections for the date
    const selections = await db
      .select({
        studentId: studentMealSelections.studentId,
        mealType: meals.mealType,
      })
      .from(studentMealSelections)
      .innerJoin(meals, eq(studentMealSelections.mealId, meals.id))
      .where(eq(meals.date, date));

    const uniqueSels: Record<string, Set<number>> = {
      breakfast: new Set(),
      lunch: new Set(),
      dinner: new Set(),
    };

    for (const s of selections) {
      if (uniqueSels[s.mealType]) {
        uniqueSels[s.mealType].add(s.studentId);
      }
    }

    const bfCount = uniqueSels.breakfast.size;
    const lnCount = uniqueSels.lunch.size;
    const dnCount = uniqueSels.dinner.size;

    const totalMeals = bfCount + lnCount + dnCount;
    const maxMeals = totalStudents * 3;
    const saved = maxMeals - totalMeals;

    // Served counts
    const served = await db
      .select({
        mealType: meals.mealType,
      })
      .from(mealDistributionHistory)
      .innerJoin(meals, eq(mealDistributionHistory.mealId, meals.id))
      .where(eq(meals.date, date));

    const servedBreakfast = served.filter((s) => s.mealType === "breakfast").length;
    const servedLunch = served.filter((s) => s.mealType === "lunch").length;
    const servedDinner = served.filter((s) => s.mealType === "dinner").length;

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
      },
    });
  }

  if (from && to) {
    // Range report
    const selections = await db
      .select({
        studentId: studentMealSelections.studentId,
        mealType: meals.mealType,
        date: meals.date,
      })
      .from(studentMealSelections)
      .innerJoin(meals, eq(studentMealSelections.mealId, meals.id))
      .where(and(gte(meals.date, from), lte(meals.date, to)));

    const dailyMap = new Map<string, { b: Set<number>; l: Set<number>; d: Set<number> }>();
    for (const s of selections) {
      const day = s.date;
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { b: new Set(), l: new Set(), d: new Set() });
      }
      const entry = dailyMap.get(day)!;
      if (s.mealType === "breakfast") entry.b.add(s.studentId);
      if (s.mealType === "lunch") entry.l.add(s.studentId);
      if (s.mealType === "dinner") entry.d.add(s.studentId);
    }

    const dailyReports = Array.from(dailyMap.entries()).map(([d, sets]) => ({
      date: d,
      breakfast: sets.b.size,
      lunch: sets.l.size,
      dinner: sets.d.size,
      total: sets.b.size + sets.l.size + sets.d.size,
      saved: (totalStudents * 3) - (sets.b.size + sets.l.size + sets.d.size),
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ reports: dailyReports, totalStudents });
  }

  return NextResponse.json({ error: "Provide date or from/to" }, { status: 400 });
}
