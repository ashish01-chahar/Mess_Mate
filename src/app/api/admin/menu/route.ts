import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menu } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    const all = await db.select().from(menu).limit(100);
    return NextResponse.json({ menu: all });
  }
  const items = await db.select().from(menu).where(eq(menu.date, date));
  return NextResponse.json({ menu: items });
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { date: menuDate, mealType, foodItems, published } = body;

  if (!menuDate || !mealType) {
    return NextResponse.json({ error: "Date and meal type required" }, { status: 400 });
  }

  // Upsert: check if exists
  const existing = await db.select().from(menu)
    .where(and(eq(menu.date, menuDate), eq(menu.mealType, mealType)))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db.update(menu)
      .set({ foodItems: foodItems || [], published: published ?? true })
      .where(eq(menu.id, existing[0].id))
      .returning();
    return NextResponse.json({ menu: updated });
  }

  const [created] = await db.insert(menu).values({
    date: menuDate,
    mealType,
    foodItems: foodItems || [],
    published: published ?? true,
  }).returning();

  return NextResponse.json({ menu: created });
}

export async function DELETE(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(menu).where(eq(menu.id, id));
  return NextResponse.json({ ok: true });
}
