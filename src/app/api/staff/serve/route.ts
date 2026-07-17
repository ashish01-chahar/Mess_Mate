import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mealServed } from "@/db/schema";
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

  const [created] = await db.insert(mealServed).values({
    studentId,
    date,
    mealType,
    staffId: me.id,
  }).returning();

  return NextResponse.json({ served: created });
}
