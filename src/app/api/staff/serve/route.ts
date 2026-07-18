import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, mealDistributionHistory, mealServed } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || (me.role !== "staff" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId, date, mealType } = await req.json();
  if (!studentId || !date || !mealType) {
    return NextResponse.json({ error: "studentId, date, and mealType required" }, { status: 400 });
  }

  // 1. Find the meal
  const [meal] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.date, date), eq(meals.mealType, mealType)))
    .limit(1);

  if (!meal) {
    return NextResponse.json({ error: "Meal not published/found for this date" }, { status: 404 });
  }

  // 2. Prevent duplicate servings (double scans)
  const [existingServed] = await db
    .select()
    .from(mealDistributionHistory)
    .where(
      and(
        eq(mealDistributionHistory.studentId, studentId),
        eq(mealDistributionHistory.mealId, meal.id)
      )
    )
    .limit(1);

  if (existingServed) {
    return NextResponse.json({ error: "Meal already served to this student" }, { status: 400 });
  }

  // 3. Insert both in transaction
  try {
    const result = await db.transaction(async (tx) => {
      const [historyRecord] = await tx
        .insert(mealDistributionHistory)
        .values({
          studentId,
          mealId: meal.id,
          staffId: me.id,
        })
        .returning();

      // Legacy served table sync
      await tx.insert(mealServed).values({
        studentId,
        date,
        mealType,
        staffId: me.id,
      });

      return historyRecord;
    });

    return NextResponse.json({ served: result });
  } catch (err) {
    console.error("Failed to mark meal served:", err);
    return NextResponse.json({ error: "Failed to mark meal served" }, { status: 500 });
  }
}
