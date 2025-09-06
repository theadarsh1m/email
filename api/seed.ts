import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Simple embedded sample data
const SAMPLE_EMAILS = [
  {
    sender: "john.doe@techcorp.com",
    subject: "Password Reset Issue",
    body: "I've been trying to reset my password for the past hour, but I'm not receiving the email. Can you help me with this?",
    sent_date: "2024-12-06 09:15:00"
  },
  {
    sender: "sarah.johnson@retailco.com",
    subject: "Billing Inquiry - Double Charge",
    body: "I was charged twice for my monthly subscription. Transaction IDs: TX123456 and TX123457. Please refund one of them.",
    sent_date: "2024-12-06 10:30:00"
  },
  {
    sender: "lisa.brown@agency.net",
    subject: "URGENT: System Outage",
    body: "Our entire team cannot access the platform. This is affecting our client deliverables. Need immediate assistance!",
    sent_date: "2024-12-06 13:20:00"
  },
  {
    sender: "dev.team@startupx.com",
    subject: "Critical Bug - Payment Processing",
    body: "Our payment processing is failing for all credit card transactions. Error code: CC_GATEWAY_ERROR. This is blocking our revenue!",
    sent_date: "2024-12-06 08:00:00"
  },
  {
    sender: "security@fintech.company",
    subject: "URGENT: Potential Security Breach",
    body: "We detected unusual API calls from unknown IP addresses. Possible security breach. Need immediate investigation!",
    sent_date: "2024-12-06 12:45:00"
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log("🌱 Starting simple seed endpoint...");
    console.log("Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "✅ Present" : "❌ Missing"
    });

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        error: "DATABASE_URL environment variable is missing",
        suggestion: "Please set DATABASE_URL in Vercel environment variables"
      });
    }

    // Import database modules dynamically to avoid build issues
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const ws = await import('ws');
    const { pgTable, text, varchar, timestamp, jsonb, boolean, integer } = await import('drizzle-orm/pg-core');
    const { sql, desc } = await import('drizzle-orm');

    neonConfig.webSocketConstructor = ws.default;

    // Define schema inline
    const emails = pgTable("emails", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      messageId: text("message_id").notNull().unique(),
      subject: text("subject").notNull(),
      sender: text("sender").notNull(),
      body: text("body").notNull(),
      receivedAt: timestamp("received_at").notNull(),
      priority: text("priority").notNull().default("normal"),
      sentiment: text("sentiment").notNull().default("neutral"),
      isProcessed: boolean("is_processed").notNull().default(false),
      isResolved: boolean("is_resolved").notNull().default(false),
      extractedInfo: jsonb("extracted_info").default({}),
      tags: text("tags").array().default([]),
      createdAt: timestamp("created_at").default(sql`now()`),
      updatedAt: timestamp("updated_at").default(sql`now()`)  
    });

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema: { emails } });

    // Test database connection
    try {
      await pool.query('SELECT 1');
      console.log("✅ Database connection successful");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return res.status(500).json({
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      });
    }

    // Check existing emails
    const existingEmails = await db.select().from(emails).limit(10);
    console.log(`📋 Found ${existingEmails.length} existing emails`);

    let processedCount = 0;
    
    for (const emailData of SAMPLE_EMAILS) {
      // Check for duplicates
      const duplicate = existingEmails.find(e => 
        e.sender === emailData.sender && e.subject === emailData.subject
      );
      
      if (duplicate) {
        console.log(`⏭️ Skipping duplicate: ${emailData.subject}`);
        continue;
      }

      // Simple priority detection
      const isUrgent = emailData.subject.toLowerCase().includes('urgent') || 
                      emailData.subject.toLowerCase().includes('critical');
      
      // Simple sentiment detection  
      const bodyLower = emailData.body.toLowerCase();
      let sentiment = "neutral";
      if (bodyLower.includes('thank') || bodyLower.includes('appreciate')) {
        sentiment = "positive";
      } else if (bodyLower.includes('problem') || bodyLower.includes('issue') || bodyLower.includes('error')) {
        sentiment = "negative";
      }

      try {
        await db.insert(emails).values({
          messageId: `simple-seed-${Date.now()}-${processedCount}`,
          subject: emailData.subject,
          sender: emailData.sender,
          body: emailData.body,
          receivedAt: new Date(emailData.sent_date),
          priority: isUrgent ? "urgent" : "normal",
          sentiment: sentiment,
          isProcessed: false,
          isResolved: false,
          extractedInfo: {},
          tags: []
        });
        
        processedCount++;
        console.log(`✅ Added: ${emailData.subject}`);
      } catch (error) {
        console.error(`❌ Failed to add email: ${emailData.subject}`, error);
      }
    }

    await pool.end();

    res.json({
      success: true,
      message: `🎉 Successfully added ${processedCount} sample emails`,
      processedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Seed operation failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({
      error: "Failed to seed database",
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}
