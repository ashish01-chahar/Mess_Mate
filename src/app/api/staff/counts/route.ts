import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mealSelections, mealServed } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me || (me.role !== "staff" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const selections = await db.select().from(mealSelections)
    .where(eq(mealSelections.date, date));

  const served = await db.select().from(mealServed)
    .where(eq(mealServed.date, date));

  const breakfastCount = selections.filter(s => s.breakfast).length;
  const lunchCount = selections.filter(s => s.lunch).length;
  const dinnerCount = selections.filter(s => s.dinner).length;

  const servedBreakfast = served.filter(s => s.mealType === "breakfast").length;
  const servedLunch = served.filter(s => s.mealType === "lunch").length;
  const servedDinner = served.filter(s => s.mealType === "dinner").length;

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
