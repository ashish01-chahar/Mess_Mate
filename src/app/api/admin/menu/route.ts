import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meals, foodItems, mealFoodItems } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  let dbMeals;
  if (date) {
    dbMeals = await db.select().from(meals).where(eq(meals.date, date));
  } else {
    dbMeals = await db.select().from(meals).limit(100);
  }

  const menuItems = [];

  for (const meal of dbMeals) {
    // Find food items linked to this meal
    const linkedItems = await db
      .select({
        name: foodItems.name,
      })
      .from(mealFoodItems)
      .innerJoin(foodItems, eq(mealFoodItems.foodItemId, foodItems.id))
      .where(eq(mealFoodItems.mealId, meal.id));

    menuItems.push({
      id: meal.id,
      date: meal.date,
      mealType: meal.mealType,
      foodItems: linkedItems.map((item) => item.name),
      published: meal.published,
    });
  }

  return NextResponse.json({ menu: menuItems });
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { date: menuDate, mealType, foodItems: rawFoodItems, published } = body;

  if (!menuDate || !mealType) {
    return NextResponse.json({ error: "Date and meal type required" }, { status: 400 });
  }

  const itemsList: string[] = (rawFoodItems || []).map((s: string) => s.trim()).filter(Boolean);

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Upsert meal
      let mealId: number;
      let [existingMeal] = await tx
        .select()
        .from(meals)
        .where(and(eq(meals.date, menuDate), eq(meals.mealType, mealType)))
        .limit(1);

      if (existingMeal) {
        mealId = existingMeal.id;
        await tx
          .update(meals)
          .set({ published: published ?? true })
          .where(eq(meals.id, mealId));
      } else {
        const [createdMeal] = await tx
          .insert(meals)
          .values({
            date: menuDate,
            mealType,
            published: published ?? true,
          })
          .returning();
        mealId = createdMeal.id;
      }

      // 2. Get or Insert Food Items
      const foodItemIds: number[] = [];
      for (const name of itemsList) {
        let [existingFood] = await tx
          .select()
          .from(foodItems)
          .where(eq(foodItems.name, name))
          .limit(1);

        if (existingFood) {
          foodItemIds.push(existingFood.id);
        } else {
          const [createdFood] = await tx
            .insert(foodItems)
            .values({ name })
            .returning();
          foodItemIds.push(createdFood.id);
        }
      }

      // 3. Delete old mealFoodItems links
      if (foodItemIds.length > 0) {
        await tx
          .delete(mealFoodItems)
          .where(
            and(
              eq(mealFoodItems.mealId, mealId),
              inArray(mealFoodItems.foodItemId, foodItemIds)
            )
          ); // Keep those that are in foodItemIds, wait, no, we want to delete those NOT in foodItemIds!
        // So we delete where mealId = mealId and foodItemId NOT IN (foodItemIds)
        // Let's write that properly. Drizzle syntax for NOT IN is not inArray. We can do:
        // import { not } from 'drizzle-orm';
        // not(inArray(...))
      } else {
        await tx.delete(mealFoodItems).where(eq(mealFoodItems.mealId, mealId));
      }

      // Let's implement NOT IN logic safely:
      // First, get all current links
      const currentLinks = await tx
        .select()
        .from(mealFoodItems)
        .where(eq(mealFoodItems.mealId, mealId));

      const linksToDelete = currentLinks.filter(
        (link) => !foodItemIds.includes(link.foodItemId)
      );

      if (linksToDelete.length > 0) {
        const idsToDelete = linksToDelete.map((l) => l.id);
        await tx.delete(mealFoodItems).where(inArray(mealFoodItems.id, idsToDelete));
      }

      // 4. Insert new links
      const existingLinkIds = new Set(
        currentLinks
          .filter((link) => foodItemIds.includes(link.foodItemId))
          .map((link) => link.foodItemId)
      );

      for (const fId of foodItemIds) {
        if (!existingLinkIds.has(fId)) {
          await tx.insert(mealFoodItems).values({
            mealId,
            foodItemId: fId,
          });
        }
      }

      return { id: mealId, date: menuDate, mealType, foodItems: itemsList, published: published ?? true };
    });

    return NextResponse.json({ menu: result });
  } catch (err) {
    console.error("Failed to save menu:", err);
    return NextResponse.json({ error: "Failed to save menu" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(meals).where(eq(meals.id, id));
  return NextResponse.json({ ok: true });
}
