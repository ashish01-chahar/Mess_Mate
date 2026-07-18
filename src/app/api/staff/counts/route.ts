import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, studentMealSelections, mealDistributionHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me || (me.role !== "staff" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  // Get student selections counts for this date
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

  const breakfastCount = uniqueSels.breakfast.size;
  const lunchCount = uniqueSels.lunch.size;
  const dinnerCount = uniqueSels.dinner.size;

  // Get served counts for this date
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

  return NextResponse.json({
    date,
    breakfastCount,
    lunchCount,
    dinnerCount,
    servedBreakfast,
    servedLunch,
    servedDinner,
    pendingBreakfast: breakfastCount - servedBreakfast,
    pendingLunch: lunchCount - servedLunch,
    pendingDinner: dinnerCount - servedDinner,
  });
}
