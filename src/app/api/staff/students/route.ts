import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, studentMealSelections, users, mealDistributionHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

  // Find the meal
  const [meal] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.date, date), eq(meals.mealType, mealType)))
    .limit(1);

  if (!meal) {
    return NextResponse.json({ students: [] });
  }

  // Get student selections for this meal
  const selections = await db
    .select({
      studentId: studentMealSelections.studentId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(studentMealSelections)
    .innerJoin(users, eq(studentMealSelections.studentId, users.id))
    .where(eq(studentMealSelections.mealId, meal.id));

  // Deduplicate students
  const studentMap = new Map<number, { studentId: number; name: string; email: string }>();
  for (const s of selections) {
    studentMap.set(s.studentId, {
      studentId: s.studentId,
      name: s.userName,
      email: s.userEmail,
    });
  }

  let studentList = Array.from(studentMap.values());

  // Search filter
  if (search) {
    studentList = studentList.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Check served status
  const served = await db
    .select()
    .from(mealDistributionHistory)
    .where(eq(mealDistributionHistory.mealId, meal.id));

  const servedIds = new Set(served.map((s) => s.studentId));

  const result = studentList.map((s) => ({
    studentId: s.studentId,
    name: s.name,
    email: s.email,
    served: servedIds.has(s.studentId),
  }));

  return NextResponse.json({ students: result });
}
