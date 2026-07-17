import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("student"), // admin, student, staff
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  course: varchar("course", { length: 100 }).notNull().default("B.Tech"),
  year: integer("year").notNull().default(1),
  hostel: varchar("hostel", { length: 100 }).notNull().default("Hostel A"),
  rollNumber: varchar("roll_number", { length: 50 }).notNull().default(""),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  designation: varchar("designation", { length: 100 }).notNull().default("Cook"),
});

export const menu = pgTable("menu", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  mealType: varchar("meal_type", { length: 20 }).notNull(), // breakfast, lunch, dinner
  foodItems: jsonb("food_items").notNull().default([]),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealSelections = pgTable("meal_selections", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  breakfast: boolean("breakfast").notNull().default(false),
  lunch: boolean("lunch").notNull().default(false),
  dinner: boolean("dinner").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mealServed = pgTable("meal_served", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  mealType: varchar("meal_type", { length: 20 }).notNull(),
  servedAt: timestamp("served_at").defaultNow().notNull(),
  staffId: integer("staff_id").references(() => users.id).notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  mealType: varchar("meal_type", { length: 20 }).notNull(),
  rating: integer("rating").notNull().default(5),
  comment: text("comment").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
