import { emails, responses, analytics, users, type User, type InsertUser, type Email, type InsertEmail, type Response, type InsertResponse, type Analytics, type InsertAnalytics } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Email methods
  getEmails(limit?: number): Promise<Email[]>;
  getEmailById(id: string): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: string, updates: Partial<Email>): Promise<Email>;
  getEmailsByPriority(priority: string): Promise<Email[]>;
  getEmailsBySentiment(sentiment: string): Promise<Email[]>;
  markEmailAsProcessed(id: string): Promise<void>;
  markEmailAsResolved(id: string): Promise<void>;
  
  // Response methods
  getResponsesByEmailId(emailId: string): Promise<Response[]>;
  createResponse(response: InsertResponse): Promise<Response>;
  updateResponse(id: string, updates: Partial<Response>): Promise<Response>;
  markResponseAsSent(id: string): Promise<void>;
  
  // Analytics methods
  getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]>;
  createOrUpdateDailyAnalytics(date: Date, data: Partial<Analytics>): Promise<Analytics>;
  getTodayStats(): Promise<Analytics | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getEmails(limit = 50): Promise<Email[]> {
    return await db.select()
      .from(emails)
      .orderBy(desc(emails.receivedAt))
      .limit(limit);
  }

  async getEmailById(id: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email || undefined;
  }

  async createEmail(email: InsertEmail): Promise<Email> {
    const [newEmail] = await db
      .insert(emails)
      .values(email)
      .returning();
    return newEmail;
  }

  async updateEmail(id: string, updates: Partial<Email>): Promise<Email> {
    const [updatedEmail] = await db
      .update(emails)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(emails.id, id))
      .returning();
    return updatedEmail;
  }

  async getEmailsByPriority(priority: string): Promise<Email[]> {
    return await db.select()
      .from(emails)
      .where(eq(emails.priority, priority))
      .orderBy(desc(emails.receivedAt));
  }

  async getEmailsBySentiment(sentiment: string): Promise<Email[]> {
    return await db.select()
      .from(emails)
      .where(eq(emails.sentiment, sentiment))
      .orderBy(desc(emails.receivedAt));
  }

  async markEmailAsProcessed(id: string): Promise<void> {
    await db
      .update(emails)
      .set({ isProcessed: true, updatedAt: sql`now()` })
      .where(eq(emails.id, id));
  }

  async markEmailAsResolved(id: string): Promise<void> {
    await db
      .update(emails)
      .set({ isResolved: true, updatedAt: sql`now()` })
      .where(eq(emails.id, id));
  }

  async getResponsesByEmailId(emailId: string): Promise<Response[]> {
    return await db.select()
      .from(responses)
      .where(eq(responses.emailId, emailId))
      .orderBy(desc(responses.generatedAt));
  }

  async createResponse(response: InsertResponse): Promise<Response> {
    const [newResponse] = await db
      .insert(responses)
      .values(response)
      .returning();
    return newResponse;
  }

  async updateResponse(id: string, updates: Partial<Response>): Promise<Response> {
    const [updatedResponse] = await db
      .update(responses)
      .set(updates)
      .where(eq(responses.id, id))
      .returning();
    return updatedResponse;
  }

  async markResponseAsSent(id: string): Promise<void> {
    await db
      .update(responses)
      .set({ isSent: true, sentAt: sql`now()` })
      .where(eq(responses.id, id));
  }

  async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return await db.select()
      .from(analytics)
      .where(and(
        gte(analytics.date, startDate),
        gte(analytics.date, endDate)
      ))
      .orderBy(desc(analytics.date));
  }

  async createOrUpdateDailyAnalytics(date: Date, data: Partial<Analytics>): Promise<Analytics> {
    const existing = await db.select()
      .from(analytics)
      .where(eq(analytics.date, date))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(analytics)
        .set(data)
        .where(eq(analytics.date, date))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(analytics)
        .values({ date, ...data } as InsertAnalytics)
        .returning();
      return created;
    }
  }

  async getTodayStats(): Promise<Analytics | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [stats] = await db.select()
      .from(analytics)
      .where(eq(analytics.date, today))
      .limit(1);
    
    return stats || undefined;
  }
}

export const storage = new DatabaseStorage();
