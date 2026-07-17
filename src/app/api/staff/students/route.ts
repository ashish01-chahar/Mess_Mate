import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mealSelections, users, mealServed } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me || (me.role !== "staff" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const search = searchParams.get("search") || "";
  const mealType = searchParams.get("mealType") || "lunch";

  // Get all students who selected this meal
  const selections = await db.select({
    selectionId: mealSelections.id,
    studentId: mealSelections.studentId,
    breakfast: mealSelections.breakfast,
    lunch: mealSelections.lunch,
    dinner: mealSelections.dinner,
    userName: users.name,
    userEmail: users.email,
  })
  .from(mealSelections)
  .innerJoin(users, eq(mealSelections.studentId, users.id))
  .where(eq(mealSelections.date, date));

  // Filter by meal type
  let filtered = selections.filter(s => {
    if (mealType === "breakfast") return s.breakfast;
    if (mealType === "lunch") return s.lunch;
    if (mealType === "dinner") return s.dinner;
    return false;
  });

  if (search) {
    filtered = filtered.filter(s =>
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Check served status
  const served = await db.select().from(mealServed)
    .where(and(eq(mealServed.date, date), eq(mealServed.mealType, mealType)));

  const servedIds = new Set(served.map(s => s.studentId));

  const result = filtered.map(s => ({
    studentId: s.studentId,
    name: s.userName,
    email: s.userEmail,
    served: servedIds.has(s.studentId),
  }));

  return NextResponse.json({ students: result });
}
