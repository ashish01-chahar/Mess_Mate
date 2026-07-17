import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET() {
  const items = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(50);
  return NextResponse.json({ notifications: items });
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, message } = await req.json();
  if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 });

  const [created] = await db.insert(notifications).values({ title, message }).returning();
  return NextResponse.json({ notification: created });
}

export async function DELETE(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(notifications).where(eq(notifications.id, id));
  return NextResponse.json({ ok: true });
}
