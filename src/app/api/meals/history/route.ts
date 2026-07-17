import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mealSelections, mealServed } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 30;

  const selections = await db.select().from(mealSelections)
    .where(eq(mealSelections.studentId, me.id))
    .orderBy(desc(mealSelections.date))
    .limit(limit);

  const served = await db.select().from(mealServed)
    .where(eq(mealServed.studentId, me.id))
    .orderBy(desc(mealServed.date))
    .limit(limit * 3);

  return NextResponse.json({ selections, served });
}
