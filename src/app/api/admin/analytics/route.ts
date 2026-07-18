import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, studentMealSelections, mealDistributionHistory, foodItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  // 1. Get request counts for each food item for this date
  const selections = await db
    .select({
      foodItemName: foodItems.name,
      mealType: meals.mealType,
      studentId: studentMealSelections.studentId,
      mealId: studentMealSelections.mealId,
      foodItemId: studentMealSelections.foodItemId,
    })
    .from(studentMealSelections)
    .innerJoin(meals, eq(studentMealSelections.mealId, meals.id))
    .innerJoin(foodItems, eq(studentMealSelections.foodItemId, foodItems.id))
    .where(eq(meals.date, date));

  // Count item requests
  const itemRequestsMap: Record<string, number> = {};
  for (const sel of selections) {
    itemRequestsMap[sel.foodItemName] = (itemRequestsMap[sel.foodItemName] || 0) + 1;
  }
  const itemRequests = Object.entries(itemRequestsMap).map(([name, count]) => ({
    name,
    count,
  })).sort((a, b) => b.count - a.count);

  // 2. Get distribution history for this date
  const servings = await db
    .select()
    .from(mealDistributionHistory)
    .innerJoin(meals, eq(mealDistributionHistory.mealId, meals.id))
    .where(eq(meals.date, date));

  // Map of studentId_mealId to check if served
  const servedSet = new Set<string>();
  for (const s of servings) {
    servedSet.add(`${s.meal_distribution_history.studentId}_${s.meal_distribution_history.mealId}`);
  }

  // Calculate waste analytics for each food item
  // A food item is served if the student selected it AND they have a distribution history entry for that meal.
  const foodStatsMap: Record<string, { selected: number; served: number; waste: number }> = {};
  for (const sel of selections) {
    const isServed = servedSet.has(`${sel.studentId}_${sel.mealId}`);

    if (!foodStatsMap[sel.foodItemName]) {
      foodStatsMap[sel.foodItemName] = { selected: 0, served: 0, waste: 0 };
    }

    foodStatsMap[sel.foodItemName].selected++;
    if (isServed) {
      foodStatsMap[sel.foodItemName].served++;
    } else {
      foodStatsMap[sel.foodItemName].waste++;
    }
  }

  const foodWasteAnalytics = Object.entries(foodStatsMap).map(([name, stats]) => ({
    name,
    selected: stats.selected,
    served: stats.served,
    waste: stats.waste,
  }));

  return NextResponse.json({
    date,
    itemRequests,
    foodWasteAnalytics,
  });
}
