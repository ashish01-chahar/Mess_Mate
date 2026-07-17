import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, students, staff, menu, mealSelections, notifications } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Check if admin exists
    const existing = await db.select().from(users).where(eq(users.email, "admin@messmate.com")).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ message: "Already seeded" });
    }

    const hash = await bcrypt.hash("password123", 10);

    // Create admin
    const [admin] = await db.insert(users).values({
      name: "Admin User",
      email: "admin@messmate.com",
      password: hash,
      role: "admin",
    }).returning();

    // Create staff
    const [staffUser] = await db.insert(users).values({
      name: "Rajesh Kumar",
      email: "staff@messmate.com",
      password: hash,
      role: "staff",
    }).returning();

    await db.insert(staff).values({
      userId: staffUser.id,
      designation: "Head Cook",
    });

    // Create sample students
    const studentNames = [
      { name: "Ashish Sharma", email: "ashish@messmate.com", roll: "CS2021001", course: "B.Tech CSE", year: 3, hostel: "Hostel A" },
      { name: "Priya Patel", email: "priya@messmate.com", roll: "CS2021002", course: "B.Tech CSE", year: 3, hostel: "Hostel B" },
      { name: "Rahul Verma", email: "rahul@messmate.com", roll: "EC2021003", course: "B.Tech ECE", year: 3, hostel: "Hostel A" },
      { name: "Sneha Gupta", email: "sneha@messmate.com", roll: "ME2022001", course: "B.Tech ME", year: 2, hostel: "Hostel B" },
      { name: "Amit Singh", email: "amit@messmate.com", roll: "CS2022002", course: "B.Tech CSE", year: 2, hostel: "Hostel C" },
      { name: "Neha Joshi", email: "neha@messmate.com", roll: "IT2021004", course: "B.Tech IT", year: 3, hostel: "Hostel B" },
      { name: "Vikram Rao", email: "vikram@messmate.com", roll: "CS2023001", course: "B.Tech CSE", year: 1, hostel: "Hostel A" },
      { name: "Ananya Das", email: "ananya@messmate.com", roll: "EC2023002", course: "B.Tech ECE", year: 1, hostel: "Hostel C" },
    ];

    for (const s of studentNames) {
      const [u] = await db.insert(users).values({
        name: s.name,
        email: s.email,
        password: hash,
        role: "student",
      }).returning();

      await db.insert(students).values({
        userId: u.id,
        course: s.course,
        year: s.year,
        hostel: s.hostel,
        rollNumber: s.roll,
      });
    }

    // Create menu for today and next 7 days
    const today = new Date();
    const menus = [
      { mealType: "breakfast", items: ["Poha", "Tea", "Bread Butter", "Banana"] },
      { mealType: "lunch", items: ["Rice", "Dal Tadka", "Paneer Butter Masala", "Roti", "Salad", "Raita"] },
      { mealType: "dinner", items: ["Chapati", "Mixed Veg", "Dal Fry", "Rice", "Gulab Jamun"] },
    ];

    const altMenus = [
      { mealType: "breakfast", items: ["Idli", "Sambar", "Coconut Chutney", "Coffee"] },
      { mealType: "lunch", items: ["Rajma", "Jeera Rice", "Aloo Gobi", "Roti", "Pickle"] },
      { mealType: "dinner", items: ["Aloo Paratha", "Curd", "Mixed Dal", "Salad"] },
    ];

    const sundayMenus = [
      { mealType: "breakfast", items: ["Chole Bhature", "Lassi", "Fruits"] },
      { mealType: "lunch", items: ["Biryani", "Raita", "Paneer Tikka", "Gulab Jamun", "Salad"] },
      { mealType: "dinner", items: ["Butter Naan", "Shahi Paneer", "Dal Makhani", "Kheer"] },
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();

      const menuSet = dayOfWeek === 0 ? sundayMenus : (i % 2 === 0 ? menus : altMenus);

      for (const m of menuSet) {
        await db.insert(menu).values({
          date: dateStr,
          mealType: m.mealType,
          foodItems: m.items,
          published: true,
        });
      }
    }

    // Create sample meal selections for today
    const todayStr = today.toISOString().slice(0, 10);
    const allStudents = await db.select().from(users).where(eq(users.role, "student"));

    for (const student of allStudents) {
      await db.insert(mealSelections).values({
        studentId: student.id,
        date: todayStr,
        breakfast: Math.random() > 0.3,
        lunch: Math.random() > 0.2,
        dinner: Math.random() > 0.25,
      });
    }

    // Also create selections for previous days for history
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      for (const student of allStudents) {
        await db.insert(mealSelections).values({
          studentId: student.id,
          date: dateStr,
          breakfast: Math.random() > 0.3,
          lunch: Math.random() > 0.2,
          dinner: Math.random() > 0.25,
        });
      }
    }

    // Create notifications
    await db.insert(notifications).values([
      { title: "Welcome to MessMate!", message: "Your smart mess management system is now live. Select your meals daily to help reduce food waste." },
      { title: "Sunday Special Menu", message: "This Sunday: Biryani, Paneer Tikka, and Kheer! Don't forget to select your meals." },
      { title: "Meal Selection Reminder", message: "Don't forget to select today's dinner before 5 PM." },
      { title: "Holiday Notice", message: "Mess will remain closed on Republic Day (26th Jan). Plan accordingly." },
    ]);

    return NextResponse.json({
      message: "Seeded successfully",
      credentials: {
        admin: { email: "admin@messmate.com", password: "password123" },
        staff: { email: "staff@messmate.com", password: "password123" },
        student: { email: "ashish@messmate.com", password: "password123" },
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Seed failed", details: String(e) }, { status: 500 });
  }
}
