import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET() {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.select().from(feedback)
    .where(eq(feedback.studentId, me.id))
    .orderBy(desc(feedback.createdAt))
    .limit(30);

  return NextResponse.json({ feedback: items });
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { date, mealType, rating, comment } = await req.json();
  if (!date || !mealType || !rating) {
    return NextResponse.json({ error: "Date, meal type, and rating required" }, { status: 400 });
  }

  const [created] = await db.insert(feedback).values({
    studentId: me.id,
    date,
    mealType,
    rating: Math.min(5, Math.max(1, rating)),
    comment: comment || "",
  }).returning();

  return NextResponse.json({ feedback: created });
}
