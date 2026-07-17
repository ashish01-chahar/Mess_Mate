import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, students, staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getUser } from "@/lib/auth";

export async function GET() {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users);

  return NextResponse.json({ users: allUsers });
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, password, role, course, year, hostel, rollNumber, designation } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const [newUser] = await db.insert(users).values({ name, email, password: hash, role }).returning();

  if (role === "student") {
    await db.insert(students).values({
      userId: newUser.id,
      course: course || "B.Tech",
      year: year || 1,
      hostel: hostel || "Hostel A",
      rollNumber: rollNumber || "",
    });
  } else if (role === "staff") {
    await db.insert(staff).values({
      userId: newUser.id,
      designation: designation || "Cook",
    });
  }

  return NextResponse.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
}

export async function DELETE(req: NextRequest) {
  const me = await getUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
