import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mealSelections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth";

function getDeadlineHour(mealType: string): number {
  switch (mealType) {
    case "breakfast": return 7;
    case "lunch": return 11;
    case "dinner": return 17;
    default: return 0;
  }
}

function isPastDeadline(mealType: string): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= getDeadlineHour(mealType);
}

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  const [selection] = await db.select().from(mealSelections)
    .where(and(eq(mealSelections.studentId, me.id), eq(mealSelections.date, date)))
    .limit(1);

  return NextResponse.json({
    selection: selection || { breakfast: false, lunch: false, dinner: false },
    deadlines: {
      breakfast: isPastDeadline("breakfast"),
      lunch: isPastDeadline("lunch"),
      dinner: isPastDeadline("dinner"),
    }
  });
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { date, mealType, selected } = await req.json();
  if (!date || !mealType) return NextResponse.json({ error: "Date and meal type required" }, { status: 400 });

  // Check deadline
  const today = new Date().toISOString().slice(0, 10);
  if (date === today && isPastDeadline(mealType)) {
    return NextResponse.json({ error: `Selection deadline for ${mealType} has passed` }, { status: 400 });
  }

  // Upsert
  const [existing] = await db.select().from(mealSelections)
    .where(and(eq(mealSelections.studentId, me.id), eq(mealSelections.date, date)))
    .limit(1);

  const updateData: Record<string, boolean | Date> = {};
  updateData[mealType] = !!selected;
  updateData.updatedAt = new Date();

  if (existing) {
    const [updated] = await db.update(mealSelections)
      .set(updateData)
      .where(eq(mealSelections.id, existing.id))
      .returning();
    return NextResponse.json({ selection: updated });
  }

  const insertData: { studentId: number; date: string; breakfast: boolean; lunch: boolean; dinner: boolean } = {
    studentId: me.id,
    date,
    breakfast: false,
    lunch: false,
    dinner: false,
  };
  if (mealType === "breakfast") insertData.breakfast = !!selected;
  if (mealType === "lunch") insertData.lunch = !!selected;
  if (mealType === "dinner") insertData.dinner = !!selected;

  const [created] = await db.insert(mealSelections).values(insertData).returning();
  return NextResponse.json({ selection: created });
}
