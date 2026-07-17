import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET() {
  const items = await db.select().from(holidays);
  return NextResponse.json({ holidays: items });
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { date, reason } = await req.json();
  if (!date || !reason) return NextResponse.json({ error: "Date and reason required" }, { status: 400 });

  const [created] = await db.insert(holidays).values({ date, reason }).returning();
  return NextResponse.json({ holiday: created });
}

export async function DELETE(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(holidays).where(eq(holidays.id, id));
  return NextResponse.json({ ok: true });
}
