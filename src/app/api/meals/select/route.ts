import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, foodItems, mealFoodItems, studentMealSelections, mealDistributionHistory, mealSelections, users } from "@/db/schema";
import { eq, and, lte, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth";

// Cutoff time checks in local time
export function isMealSelectionEditable(dateStr: string, mealType: string): boolean {
  const now = new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  const cutoffDate = new Date(year, month - 1, day);

  if (mealType === "breakfast") {
    cutoffDate.setHours(9, 0, 0, 0); // editable until 9:00 AM
  } else if (mealType === "lunch") {
    cutoffDate.setHours(13, 0, 0, 0); // editable until 1:00 PM
  } else if (mealType === "dinner") {
    cutoffDate.setHours(20, 0, 0, 0); // editable until 8:00 PM
  } else {
    return false;
  }

  return now.getTime() < cutoffDate.getTime();
}

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  // Get all meals for this date
  const dayMeals = await db.select().from(meals).where(eq(meals.date, date));

  const menu = [];
  const selections: Record<number, number[]> = {};
  const servings: Record<string, any> = {};

  for (const meal of dayMeals) {
    // Find food items linked to this meal
    const linkedItems = await db
      .select({
        id: foodItems.id,
        name: foodItems.name,
      })
      .from(mealFoodItems)
      .innerJoin(foodItems, eq(mealFoodItems.foodItemId, foodItems.id))
      .where(eq(mealFoodItems.mealId, meal.id));

    menu.push({
      id: meal.id,
      mealType: meal.mealType,
      items: linkedItems,
      published: meal.published,
    });

    // Find student selections for this meal
    const studentSels = await db
      .select({
        foodItemId: studentMealSelections.foodItemId,
      })
      .from(studentMealSelections)
      .where(
        and(
          eq(studentMealSelections.studentId, me.id),
          eq(studentMealSelections.mealId, meal.id)
        )
      );

    selections[meal.id] = studentSels.map((s) => s.foodItemId);

    // Check serving status for this meal
    const [serving] = await db
      .select({
        servedAt: mealDistributionHistory.servedAt,
        staffName: users.name,
      })
      .from(mealDistributionHistory)
      .innerJoin(users, eq(mealDistributionHistory.staffId, users.id))
      .where(
        and(
          eq(mealDistributionHistory.studentId, me.id),
          eq(mealDistributionHistory.mealId, meal.id)
        )
      )
      .limit(1);

    servings[meal.mealType] = {
      served: !!serving,
      servedAt: serving?.servedAt || null,
      staffName: serving?.staffName || null,
    };
  }

  return NextResponse.json({
    menu,
    selections,
    servings,
    deadlines: {
      breakfast: !isMealSelectionEditable(date, "breakfast"),
      lunch: !isMealSelectionEditable(date, "lunch"),
      dinner: !isMealSelectionEditable(date, "dinner"),
    },
  });
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { date, mealId, foodItemIds } = await req.json();
  if (!date || !mealId || !Array.isArray(foodItemIds)) {
    return NextResponse.json({ error: "date, mealId, and foodItemIds (array) required" }, { status: 400 });
  }

  // Find the meal to check its type
  const [meal] = await db.select().from(meals).where(eq(meals.id, mealId)).limit(1);
  if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });

  // 1. Check selection deadline
  if (!isMealSelectionEditable(date, meal.mealType)) {
    return NextResponse.json({ error: `Selection deadline for ${meal.mealType} has passed` }, { status: 400 });
  }

  // 2. Check if meal has already been served to this student
  const [serving] = await db
    .select()
    .from(mealDistributionHistory)
    .where(
      and(
        eq(mealDistributionHistory.studentId, me.id),
        eq(mealDistributionHistory.mealId, mealId)
      )
    )
    .limit(1);

  if (serving) {
    return NextResponse.json({ error: "Cannot modify selection. Meal has already been served." }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
      // 3. Delete existing selections
      await tx
        .delete(studentMealSelections)
        .where(
          and(
            eq(studentMealSelections.studentId, me.id),
            eq(studentMealSelections.mealId, mealId)
          )
        );

      // 4. Insert new selections
      if (foodItemIds.length > 0) {
        const insertValues = foodItemIds.map((itemId) => ({
          studentId: me.id,
          mealId,
          foodItemId: itemId,
        }));
        await tx.insert(studentMealSelections).values(insertValues);
      }

      // 5. Update legacy mealSelections table for backwards compatibility
      const [existingLegacy] = await tx
        .select()
        .from(mealSelections)
        .where(
          and(
            eq(mealSelections.studentId, me.id),
            eq(mealSelections.date, date)
          )
        )
        .limit(1);

      const hasSelectedMeal = foodItemIds.length > 0;
      const legacyUpdate: Record<string, any> = {
        [meal.mealType]: hasSelectedMeal,
        updatedAt: new Date(),
      };

      if (existingLegacy) {
        await tx
          .update(mealSelections)
          .set(legacyUpdate)
          .where(eq(mealSelections.id, existingLegacy.id));
      } else {
        const legacyInsert = {
          studentId: me.id,
          date,
          breakfast: meal.mealType === "breakfast" ? hasSelectedMeal : false,
          lunch: meal.mealType === "lunch" ? hasSelectedMeal : false,
          dinner: meal.mealType === "dinner" ? hasSelectedMeal : false,
        };
        await tx.insert(mealSelections).values(legacyInsert);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save selection:", err);
    return NextResponse.json({ error: "Failed to save selection" }, { status: 500 });
  }
}
