import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, studentMealSelections, foodItems, mealDistributionHistory, users } from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 30; // 30 meals

  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch past published meals
  const pastMeals = await db
    .select()
    .from(meals)
    .where(and(eq(meals.published, true), lte(meals.date, todayStr)))
    .orderBy(desc(meals.date), desc(meals.mealType))
    .limit(limit);

  if (pastMeals.length === 0) {
    return NextResponse.json({ history: [] });
  }

  const mealIds = pastMeals.map((m) => m.id);

  // Fetch selections for these meals for this student
  const selections = await db
    .select({
      mealId: studentMealSelections.mealId,
      foodItemName: foodItems.name,
    })
    .from(studentMealSelections)
    .innerJoin(foodItems, eq(studentMealSelections.foodItemId, foodItems.id))
    .where(
      and(
        eq(studentMealSelections.studentId, me.id),
        inArraySafe(studentMealSelections.mealId, mealIds)
      )
    );

  // Map selections by mealId
  const selectionMap: Record<number, string[]> = {};
  for (const s of selections) {
    if (!selectionMap[s.mealId]) selectionMap[s.mealId] = [];
    selectionMap[s.mealId].push(s.foodItemName);
  }

  // Fetch servings for these meals for this student
  const servings = await db
    .select({
      mealId: mealDistributionHistory.mealId,
      servedAt: mealDistributionHistory.servedAt,
      staffName: users.name,
    })
    .from(mealDistributionHistory)
    .innerJoin(users, eq(mealDistributionHistory.staffId, users.id))
    .where(
      and(
        eq(mealDistributionHistory.studentId, me.id),
        inArraySafe(mealDistributionHistory.mealId, mealIds)
      )
    );

  const servingMap: Record<number, typeof servings[0]> = {};
  for (const s of servings) {
    servingMap[s.mealId] = s;
  }

  // Build final history records
  const history = pastMeals.map((meal) => {
    const selectedItems = selectionMap[meal.id] || [];
    const serving = servingMap[meal.id];

    let status: "Served" | "Missed" | "Not Taken" = "Not Taken";
    if (serving) {
      status = "Served";
    } else if (selectedItems.length > 0) {
      status = "Missed";
    }

    return {
      id: meal.id,
      date: meal.date,
      mealType: meal.mealType,
      status,
      items: selectedItems,
      servedAt: serving?.servedAt || null,
      staffName: serving?.staffName || null,
    };
  });

  return NextResponse.json({ history });
}

// Helper function to safely execute inArray even for empty arrays
function inArraySafe(column: any, values: any[]) {
  if (values.length === 0) {
    return eq(column, -1); // returns false condition
  }
  return inArray(column, values);
}
import { inArray } from "drizzle-orm";
