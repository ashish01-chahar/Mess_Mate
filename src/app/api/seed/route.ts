import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, students, staff, menu, mealSelections, notifications, meals, foodItems, mealFoodItems, studentMealSelections, mealDistributionHistory } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Clean existing tables in correct order of dependency
    await db.delete(mealDistributionHistory);
    await db.delete(studentMealSelections);
    await db.delete(mealFoodItems);
    await db.delete(foodItems);
    await db.delete(meals);
    await db.delete(mealSelections);
    await db.delete(menu);
    await db.delete(notifications);
    await db.delete(students);
    await db.delete(staff);
    await db.delete(users);

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

    // Create menu for past 7 days, today, and next 7 days
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

    const getFoodItemId = async (name: string) => {
      const trimmed = name.trim();
      const [existing] = await db.select().from(foodItems).where(eq(foodItems.name, trimmed)).limit(1);
      if (existing) return existing.id;
      const [inserted] = await db.insert(foodItems).values({ name: trimmed }).returning();
      return inserted.id;
    };

    for (let i = -7; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();

      const menuSet = dayOfWeek === 0 ? sundayMenus : (Math.abs(i) % 2 === 0 ? menus : altMenus);

      for (const m of menuSet) {
        // Populating legacy menu table
        await db.insert(menu).values({
          date: dateStr,
          mealType: m.mealType,
          foodItems: m.items,
          published: true,
        });

        // Populating new meals table
        const [meal] = await db.insert(meals).values({
          date: dateStr,
          mealType: m.mealType,
          published: true,
        }).returning();

        // Populate food items and map them
        for (const item of m.items) {
          const foodItemId = await getFoodItemId(item);
          await db.insert(mealFoodItems).values({
            mealId: meal.id,
            foodItemId,
          });
        }
      }
    }

    // Create sample selections and servings
    const allStudents = await db.select().from(users).where(eq(users.role, "student"));
    const headCook = staffUser;

    for (let i = -7; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);

      // Get meals for this date
      const dayMeals = await db.select().from(meals).where(eq(meals.date, dateStr));

      for (const student of allStudents) {
        // Legacy selections
        const legacyBreakfast = Math.random() > 0.3;
        const legacyLunch = Math.random() > 0.2;
        const legacyDinner = Math.random() > 0.25;

        await db.insert(mealSelections).values({
          studentId: student.id,
          date: dateStr,
          breakfast: legacyBreakfast,
          lunch: legacyLunch,
          dinner: legacyDinner,
        });

        // New selections & serving history
        for (const meal of dayMeals) {
          const isSelected = meal.mealType === "breakfast" ? legacyBreakfast : (meal.mealType === "lunch" ? legacyLunch : legacyDinner);

          if (isSelected) {
            // Get food items for this meal
            const linkedItems = await db.select({
              id: foodItems.id,
              name: foodItems.name,
            })
            .from(mealFoodItems)
            .innerJoin(foodItems, eq(mealFoodItems.foodItemId, foodItems.id))
            .where(eq(mealFoodItems.mealId, meal.id));

            // Select a subset of food items (always first one, 80% for others)
            const selectedItems = linkedItems.filter((_, idx) => idx === 0 || Math.random() > 0.2);

            for (const item of selectedItems) {
              await db.insert(studentMealSelections).values({
                studentId: student.id,
                mealId: meal.id,
                foodItemId: item.id,
              });
            }

            // In the past, randomly mark as served (80% chance)
            if (i < 0 && Math.random() > 0.2) {
              const servedTime = new Date(d);
              if (meal.mealType === "breakfast") servedTime.setHours(8, Math.floor(Math.random() * 45));
              else if (meal.mealType === "lunch") servedTime.setHours(13, Math.floor(Math.random() * 45));
              else servedTime.setHours(20, Math.floor(Math.random() * 45));

              await db.insert(mealDistributionHistory).values({
                studentId: student.id,
                mealId: meal.id,
                staffId: headCook.id,
                servedAt: servedTime,
              });
            }
          }
        }
      }
    }

    // Create notifications
    await db.insert(notifications).values([
      { title: "Welcome to MessMate!", message: "Your smart mess management system is now live. Select your meals daily to help reduce food waste." },
      { title: "Sunday Special Menu", message: "This Sunday: Biryani, Paneer Tikka, and Kheer! Don't forget to select your meals." },
      { title: "Meal Selection Checklist System Reminders", message: "Don't forget to select today's dinner before 8 PM." },
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
