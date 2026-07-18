import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, students, meals, studentMealSelections, foodItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getUser();
  if (!me || (me.role !== "staff" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  // Fetch all student selections for the given date
  const data = await db
    .select({
      studentId: users.id,
      studentName: users.name,
      studentEmail: users.email,
      rollNumber: students.rollNumber,
      mealType: meals.mealType,
      foodItemName: foodItems.name,
    })
    .from(studentMealSelections)
    .innerJoin(meals, eq(studentMealSelections.mealId, meals.id))
    .innerJoin(foodItems, eq(studentMealSelections.foodItemId, foodItems.id))
    .innerJoin(users, eq(studentMealSelections.studentId, users.id))
    .innerJoin(students, eq(users.id, students.userId))
    .where(eq(meals.date, date));

  // Structure the data grouped by meal type, then by student
  const result: Record<string, any[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  const studentMap: Record<string, Record<number, { name: string; rollNumber: string; email: string; items: string[] }>> = {
    breakfast: {},
    lunch: {},
    dinner: {},
  };

  for (const row of data) {
    const { mealType, studentId, studentName, rollNumber, studentEmail, foodItemName } = row;
    if (!result[mealType]) continue;

    if (!studentMap[mealType][studentId]) {
      studentMap[mealType][studentId] = {
        name: studentName,
        rollNumber: rollNumber,
        email: studentEmail,
        items: [],
      };
    }
    studentMap[mealType][studentId].items.push(foodItemName);
  }

  // Convert map to list
  for (const meal of ["breakfast", "lunch", "dinner"]) {
    result[meal] = Object.entries(studentMap[meal]).map(([id, s]) => ({
      studentId: Number(id),
      name: s.name,
      rollNumber: s.rollNumber,
      email: s.email,
      items: s.items,
    }));
  }

  return NextResponse.json({ date, requests: result });
}
