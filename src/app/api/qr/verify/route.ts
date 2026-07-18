import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, students, meals, mealFoodItems, foodItems, studentMealSelections, mealDistributionHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Only staff and admin can verify QR
  const me = await getUser();
  if (!me || (me.role !== "staff" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = Number(searchParams.get("studentId"));
  const mealType = searchParams.get("mealType");
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  if (!studentId || !mealType) {
    return NextResponse.json({ error: "studentId and mealType required" }, { status: 400 });
  }

  // Find user and student details
  const [studentDetails] = await db
    .select({
      name: users.name,
      email: users.email,
      rollNumber: students.rollNumber,
      course: students.course,
      hostel: students.hostel,
    })
    .from(users)
    .innerJoin(students, eq(users.id, students.userId))
    .where(eq(users.id, studentId))
    .limit(1);

  if (!studentDetails) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Find the meal
  const [meal] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.date, date), eq(meals.mealType, mealType)))
    .limit(1);

  if (!meal) {
    return NextResponse.json({
      studentDetails,
      mealType,
      date,
      menuPublished: false,
      items: [],
      served: false,
    });
  }

  // Get all food items for this meal menu
  const menuItems = await db
    .select({
      id: foodItems.id,
      name: foodItems.name,
    })
    .from(mealFoodItems)
    .innerJoin(foodItems, eq(mealFoodItems.foodItemId, foodItems.id))
    .where(eq(mealFoodItems.mealId, meal.id));

  // Get student's selections for this meal
  const selections = await db
    .select({
      foodItemId: studentMealSelections.foodItemId,
    })
    .from(studentMealSelections)
    .where(
      and(
        eq(studentMealSelections.studentId, studentId),
        eq(studentMealSelections.mealId, meal.id)
      )
    );

  const selectedItemIds = new Set(selections.map((s) => s.foodItemId));

  // Check if served already
  const [serving] = await db
    .select({
      servedAt: mealDistributionHistory.servedAt,
    })
    .from(mealDistributionHistory)
    .where(
      and(
        eq(mealDistributionHistory.studentId, studentId),
        eq(mealDistributionHistory.mealId, meal.id)
      )
    )
    .limit(1);

  // Build the checklist items
  const items = menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    selected: selectedItemIds.has(item.id),
  }));

  // Has selected at least one item?
  const hasSelectedMeal = selections.length > 0;

  return NextResponse.json({
    studentDetails,
    mealId: meal.id,
    mealType,
    date,
    menuPublished: true,
    hasSelectedMeal,
    items,
    served: !!serving,
    servedAt: serving?.servedAt || null,
  });
}
