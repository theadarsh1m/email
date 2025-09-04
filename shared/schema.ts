import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: text("message_id").notNull().unique(),
  subject: text("subject").notNull(),
  sender: text("sender").notNull(),
  body: text("body").notNull(),
  receivedAt: timestamp("received_at").notNull(),
  priority: text("priority").notNull().default("normal"), // urgent, normal
  sentiment: text("sentiment").notNull().default("neutral"), // positive, negative, neutral
  isProcessed: boolean("is_processed").notNull().default(false),
  isResolved: boolean("is_resolved").notNull().default(false),
  extractedInfo: jsonb("extracted_info").default({}), // contact details, customer info
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: varchar("email_id").notNull().references(() => emails.id),
  content: text("content").notNull(),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  generatedAt: timestamp("generated_at").default(sql`now()`),
  model: text("model").notNull().default("gpt-5"),
  confidence: integer("confidence").default(0), // 0-100
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  totalEmails: integer("total_emails").notNull().default(0),
  resolvedEmails: integer("resolved_emails").notNull().default(0),
  pendingEmails: integer("pending_emails").notNull().default(0),
  urgentEmails: integer("urgent_emails").notNull().default(0),
  avgResponseTime: integer("avg_response_time").notNull().default(0), // in minutes
  sentimentBreakdown: jsonb("sentiment_breakdown").default({}), // {positive: 45, neutral: 35, negative: 20}
});

export const emailRelations = relations(emails, ({ many }) => ({
  responses: many(responses),
}));

export const responseRelations = relations(responses, ({ one }) => ({
  email: one(emails, {
    fields: [responses.emailId],
    references: [emails.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  generatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
